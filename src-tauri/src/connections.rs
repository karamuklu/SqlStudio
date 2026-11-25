use serde::{Deserialize, Serialize};
use serde_json::Value;
use futures_util::TryStreamExt;
use std::{error::Error as StdError, fs, path::PathBuf, time::Duration};
use tauri::{AppHandle, Manager};
use tiberius::{AuthMethod, Client, ColumnData, Config, EncryptionLevel, FromSql, QueryItem, SqlBrowser};
use tokio::net::{TcpStream, UdpSocket};
use tokio_util::compat::{Compat, TokioAsyncWriteCompatExt};

const KEYRING_SERVICE: &str = "com.karamuklu.sqlstudio";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionProfile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub color: String,
    pub environment: String,
    pub host: String,
    pub port: u16,
    pub instance: String,
    pub database: String,
    pub auth_type: String,
    pub username: String,
    pub save_password: String,
    pub encrypt: bool,
    pub trust_server_certificate: bool,
    pub connect_timeout_seconds: u64,
    pub query_timeout_seconds: u64,
    pub application_name: String,
    pub readonly: bool,
    pub url: String,
    pub ssh: SshConfig,
    pub schemas: Vec<String>,
    pub hide_system_databases: bool,
    pub advanced: Vec<AdvancedProperty>,
    #[serde(default)]
    pub startup_sql: String,
    #[serde(default = "default_true")]
    pub auto_commit: bool,
    #[serde(default = "default_schema")]
    pub default_schema: String,
    #[serde(default = "default_pool_size")]
    pub pool_size: u16,
    #[serde(default)]
    pub ca_certificate_path: String,
    #[serde(default)]
    pub language: String,
    #[serde(default)]
    pub date_format: String,
}

fn default_true() -> bool { true }
fn default_schema() -> String { "dbo".to_string() }
fn default_pool_size() -> u16 { 5 }

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SshConfig {
    pub enabled: bool,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_method: String,
    pub private_key_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdvancedProperty {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionRequest {
    pub profile: ConnectionProfile,
    pub password: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionTestResult {
    pub success: bool,
    pub duration_ms: u128,
    pub server_version: String,
    pub server_name: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlInstanceInfo {
    pub name: String,
    pub port: u16,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseObject {
    pub schema: String,
    pub name: String,
    pub kind: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseObjectsResult {
    pub database: String,
    pub objects: Vec<DatabaseObject>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryExecutionResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<Value>>,
    pub duration_ms: u128,
    pub message: String,
    pub truncated: bool,
}

fn profiles_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Uygulama veri klasörü bulunamadı: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Uygulama veri klasörü oluşturulamadı: {error}"))?;
    Ok(directory.join("connections.json"))
}

#[tauri::command]
pub fn load_connection_profiles(app: AppHandle) -> Result<Vec<ConnectionProfile>, String> {
    let path = profiles_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(path)
        .map_err(|error| format!("Bağlantı tanımları okunamadı: {error}"))?;
    serde_json::from_str(&content)
        .map_err(|error| format!("Bağlantı tanımları geçersiz: {error}"))
}

#[tauri::command]
pub fn save_connection_profiles(
    app: AppHandle,
    profiles: Vec<ConnectionProfile>,
) -> Result<(), String> {
    let path = profiles_path(&app)?;
    let temporary_path = path.with_extension("json.tmp");
    let content = serde_json::to_string_pretty(&profiles)
        .map_err(|error| format!("Bağlantı tanımları hazırlanamadı: {error}"))?;
    fs::write(&temporary_path, content)
        .map_err(|error| format!("Bağlantı tanımları yazılamadı: {error}"))?;
    fs::rename(&temporary_path, &path)
        .map_err(|error| format!("Bağlantı tanımları kaydedilemedi: {error}"))
}

fn credential_entry(connection_id: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYRING_SERVICE, connection_id)
        .map_err(|error| format!("Windows Credential Manager açılamadı: {error}"))
}

#[tauri::command]
pub fn store_connection_password(connection_id: String, password: String) -> Result<(), String> {
    credential_entry(&connection_id)?
        .set_password(&password)
        .map_err(|error| format!("Parola güvenli kasaya kaydedilemedi: {error}"))
}

#[tauri::command]
pub fn delete_connection_password(connection_id: String) -> Result<(), String> {
    match credential_entry(&connection_id)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(format!("Kayıtlı parola silinemedi: {error}")),
    }
}

fn resolve_password(request: &ConnectionRequest) -> Result<String, String> {
    if let Some(password) = request.password.as_ref().filter(|value| !value.is_empty()) {
        return Ok(password.clone());
    }
    credential_entry(&request.profile.id)?
        .get_password()
        .map_err(|_| "Parola girilmedi veya güvenli kasada kayıtlı parola bulunamadı.".to_string())
}

fn effective_host_instance(profile: &ConnectionProfile) -> (&str, Option<&str>) {
    let raw_host = profile.host.trim();
    if !profile.instance.trim().is_empty() {
        return (raw_host.split_once('\\').map_or(raw_host, |(host, _)| host), Some(profile.instance.trim()));
    }
    raw_host
        .split_once('\\')
        .map_or((raw_host, None), |(host, instance)| (host.trim(), Some(instance.trim())))
}

fn build_config(request: &ConnectionRequest) -> Result<Config, String> {
    let profile = &request.profile;
    if profile.host.trim().is_empty() {
        return Err("Sunucu alanı boş olamaz.".to_string());
    }

    let (host, instance) = effective_host_instance(profile);
    let mut config = Config::new();
    config.host(host);
    config.port(if profile.port == 0 { 1433 } else { profile.port });
    if let Some(instance) = instance.filter(|value| !value.is_empty()) {
        config.instance_name(instance);
    }
    if !profile.database.trim().is_empty() {
        config.database(profile.database.trim());
    }
    config.application_name(if profile.application_name.trim().is_empty() {
        "SqlStudio"
    } else {
        profile.application_name.trim()
    });
    config.readonly(profile.readonly);
    if profile.encrypt {
        config.encryption(EncryptionLevel::Required);
        if profile.trust_server_certificate {
            config.trust_cert();
        }
    } else {
        // Keep the login packet protected even when full-session encryption is disabled.
        config.encryption(EncryptionLevel::Off);
    }

    match profile.auth_type.as_str() {
        "integrated" => config.authentication(AuthMethod::Integrated),
        "sqlServer" => {
            if profile.username.trim().is_empty() {
                return Err("SQL Server kimlik doğrulaması için kullanıcı adı zorunludur.".to_string());
            }
            config.authentication(AuthMethod::sql_server(
                profile.username.trim(),
                resolve_password(request)?,
            ));
        }
        "azureAdPassword" => {
            return Err("Azure AD kullanıcı/parola akışı erişim belirteci gerektirir; bu kimlik doğrulama türü henüz etkin değil.".to_string());
        }
        "none" => config.authentication(AuthMethod::None),
        _ => return Err("Bilinmeyen kimlik doğrulama türü.".to_string()),
    }

    Ok(config)
}

async fn open_client(
    request: &ConnectionRequest,
) -> Result<Client<Compat<TcpStream>>, String> {
    if request.profile.ssh.enabled {
        return Err("SSH tüneli yapılandırıldı ancak yerel tünel hizmeti henüz başlatılmadı.".to_string());
    }

    let has_named_instance = effective_host_instance(&request.profile).1.is_some();
    // Port 1433 is the form default, so a named instance still needs SQL Browser.
    // Once discovery supplies a non-default port, connect directly so the saved
    // profile keeps working even when SQL Browser is later unavailable.
    let use_sql_browser = has_named_instance && request.profile.port == 1433;
    let config = build_config(request)?;
    let timeout = Duration::from_secs(request.profile.connect_timeout_seconds.max(1));
    let tcp = if !use_sql_browser {
        tokio::time::timeout(timeout, TcpStream::connect(config.get_addr()))
            .await
            .map_err(|_| "Bağlantı zaman aşımına uğradı. Sunucu ve güvenlik duvarını kontrol edin.".to_string())?
            .map_err(|error| translate_connection_error(&error.to_string()))?
    } else {
        tokio::time::timeout(timeout, TcpStream::connect_named(&config))
            .await
            .map_err(|_| "SQL Browser yanıt vermedi. Instance adını veya 1434/UDP erişimini kontrol edin.".to_string())?
            .map_err(|error| translate_connection_error(&error.to_string()))?
    };
    tcp.set_nodelay(true)
        .map_err(|error| format!("TCP bağlantısı hazırlanamadı: {error}"))?;
    tokio::time::timeout(timeout, Client::connect(config, tcp.compat_write()))
        .await
        .map_err(|_| "SQL Server oturum açma işlemi zaman aşımına uğradı.".to_string())?
        .map_err(|error| translate_connection_error(&error_chain(&error)))
}

fn translate_connection_error(error: &str) -> String {
    let lower = error.to_lowercase();
    if lower.contains("login failed") {
        return format!("Kimlik doğrulama başarısız. SSMS'te 'sa' ile bağlanıyorsanız Kimlik doğrulama alanında 'Kullanıcı adı ve parola'yı seçip aynı SQL hesabını kullanın. ({error})");
    }
    if lower.contains("certificate") || lower.contains("tls") {
        return format!("TLS sertifikası doğrulanamadı. Sertifika ayarlarını kontrol edin. ({error})");
    }
    if lower.contains("refused") || lower.contains("actively refused") {
        return format!("Sunucu bağlantıyı reddetti. SQL Server TCP/IP ve port ayarlarını kontrol edin. ({error})");
    }
    if lower.contains("11001") || lower.contains("name") || lower.contains("dns") {
        return format!("Sunucu adı çözümlenemedi. SUNUCU\\INSTANCE yazdıysanız instance adının doğru olduğunu ve SQL Server Browser hizmetinin çalıştığını kontrol edin. ({error})");
    }
    format!("SQL Server bağlantısı kurulamadı: {error}")
}

fn error_chain(error: &(dyn StdError + 'static)) -> String {
    let mut messages = vec![error.to_string()];
    let mut source = error.source();
    while let Some(cause) = source {
        let message = cause.to_string();
        if !messages.contains(&message) {
            messages.push(message);
        }
        source = cause.source();
    }
    messages.join(" → ")
}

#[tauri::command]
pub async fn test_sql_connection(
    request: ConnectionRequest,
) -> Result<ConnectionTestResult, String> {
    let started = std::time::Instant::now();
    let mut client = open_client(&request).await?;
    let query_timeout = Duration::from_secs(request.profile.query_timeout_seconds.max(1));
    let row = tokio::time::timeout(query_timeout, async {
        client
            .simple_query(
                "SELECT CONVERT(nvarchar(128), SERVERPROPERTY('ProductVersion')) AS version, @@SERVERNAME AS server_name",
            )
            .await?
            .into_row()
            .await
    })
        .await
        .map_err(|_| "Bağlantı testi sorgusu zaman aşımına uğradı.".to_string())?
        .map_err(|error| translate_connection_error(&error_chain(&error)))?
        .ok_or_else(|| "Sunucu sürüm bilgisi döndürmedi.".to_string())?;
    let version = row.get::<&str, _>("version").unwrap_or("Bilinmiyor").to_string();
    let server_name = row
        .get::<&str, _>("server_name")
        .unwrap_or(request.profile.host.as_str())
        .to_string();

    Ok(ConnectionTestResult {
        success: true,
        duration_ms: started.elapsed().as_millis(),
        server_version: version,
        server_name,
        message: "Bağlantı başarılı.".to_string(),
    })
}

#[tauri::command]
pub async fn list_sql_databases(request: ConnectionRequest) -> Result<Vec<String>, String> {
    let mut client = open_client(&request).await?;
    let query_timeout = Duration::from_secs(request.profile.query_timeout_seconds.max(1));
    let rows = tokio::time::timeout(query_timeout, async {
        client
            .simple_query("SELECT name FROM sys.databases WHERE state = 0 ORDER BY name")
            .await?
            .into_first_result()
            .await
    })
        .await
        .map_err(|_| "Veritabanı listesi sorgusu zaman aşımına uğradı.".to_string())?
        .map_err(|error| translate_connection_error(&error_chain(&error)))?;
    Ok(rows
        .into_iter()
        .filter_map(|row| row.get::<&str, _>("name").map(str::to_string))
        .collect())
}

fn request_for_database(mut request: ConnectionRequest, database: &str) -> Result<ConnectionRequest, String> {
    let database = database.trim();
    if database.is_empty() {
        return Err("Veritabanı seçilmedi.".to_string());
    }
    request.profile.database = database.to_string();
    Ok(request)
}

#[tauri::command]
pub async fn load_database_objects(request: ConnectionRequest, database: String) -> Result<DatabaseObjectsResult, String> {
    let request = request_for_database(request, &database)?;
    let mut client = open_client(&request).await?;
    let query_timeout = Duration::from_secs(request.profile.query_timeout_seconds.max(1));
    let rows = tokio::time::timeout(query_timeout, async {
        client.simple_query(
            "SELECT s.name AS schema_name, o.name AS object_name,\
             CASE WHEN o.type = 'U' THEN 'table' WHEN o.type = 'V' THEN 'view'\
                  WHEN o.type = 'P' THEN 'procedure' ELSE 'function' END AS object_kind\
             FROM sys.objects o INNER JOIN sys.schemas s ON s.schema_id = o.schema_id\
             WHERE o.is_ms_shipped = 0 AND o.type IN ('U','V','P','FN','IF','TF')\
             ORDER BY object_kind, s.name, o.name"
        ).await?.into_first_result().await
    })
        .await
        .map_err(|_| "Veritabanı nesneleri sorgusu zaman aşımına uğradı.".to_string())?
        .map_err(|error| translate_connection_error(&error_chain(&error)))?;
    let objects = rows.into_iter().filter_map(|row| {
        Some(DatabaseObject {
            schema: row.get::<&str, _>("schema_name")?.to_string(),
            name: row.get::<&str, _>("object_name")?.to_string(),
            kind: row.get::<&str, _>("object_kind")?.to_string(),
        })
    }).collect();
    Ok(DatabaseObjectsResult { database, objects })
}

fn option_value<T: ToString>(value: &Option<T>) -> Value {
    value.as_ref().map_or(Value::Null, |value| Value::String(value.to_string()))
}

fn converted_value<'a, T>(value: &'a ColumnData<'static>) -> Value
where
    T: FromSql<'a> + ToString,
{
    T::from_sql(value).ok().flatten().map_or(Value::Null, |value| Value::String(value.to_string()))
}

fn column_value(value: &ColumnData<'static>) -> Value {
    match value {
        ColumnData::U8(value) => value.map_or(Value::Null, |value| Value::from(value)),
        ColumnData::I16(value) => value.map_or(Value::Null, |value| Value::from(value)),
        ColumnData::I32(value) => value.map_or(Value::Null, |value| Value::from(value)),
        ColumnData::I64(value) => value.map_or(Value::Null, |value| Value::from(value)),
        ColumnData::F32(value) => value.and_then(|value| serde_json::Number::from_f64(value as f64)).map_or(Value::Null, Value::Number),
        ColumnData::F64(value) => value.and_then(serde_json::Number::from_f64).map_or(Value::Null, Value::Number),
        ColumnData::Bit(value) => value.map_or(Value::Null, Value::Bool),
        ColumnData::String(value) => value.as_ref().map_or(Value::Null, |value| Value::String(value.to_string())),
        ColumnData::Guid(value) => option_value(value),
        ColumnData::Binary(value) => value.as_ref().map_or(Value::Null, |bytes| Value::String(bytes.iter().map(|byte| format!("{byte:02X}")).collect())),
        ColumnData::Numeric(value) => option_value(value),
        ColumnData::Xml(value) => value.as_ref().map_or(Value::Null, |value| Value::String(value.to_string())),
        ColumnData::DateTime(_) => converted_value::<chrono::NaiveDateTime>(value),
        ColumnData::SmallDateTime(_) => converted_value::<chrono::NaiveDateTime>(value),
        ColumnData::Time(_) => converted_value::<chrono::NaiveTime>(value),
        ColumnData::Date(_) => converted_value::<chrono::NaiveDate>(value),
        ColumnData::DateTime2(_) => converted_value::<chrono::NaiveDateTime>(value),
        ColumnData::DateTimeOffset(_) => converted_value::<chrono::DateTime<chrono::FixedOffset>>(value),
    }
}

#[tauri::command]
pub async fn execute_sql_query(request: ConnectionRequest, database: String, sql: String) -> Result<QueryExecutionResult, String> {
    if sql.trim().is_empty() {
        return Err("Çalıştırılacak SQL sorgusu boş.".to_string());
    }
    let request = request_for_database(request, &database)?;
    let mut client = open_client(&request).await?;
    let query_timeout = Duration::from_secs(request.profile.query_timeout_seconds.max(1));
    let started = std::time::Instant::now();
    let (columns, rows, truncated) = tokio::time::timeout(query_timeout, async {
        let mut stream = client.simple_query(&sql).await?;
        let mut columns = Vec::new();
        let mut rows = Vec::new();
        let mut result_index = None;
        let mut truncated = false;
        while let Some(item) = stream.try_next().await? {
            match item {
                QueryItem::Metadata(metadata) if result_index.is_none() => {
                    result_index = Some(metadata.result_index());
                    columns = metadata.columns().iter().map(|column| column.name().to_string()).collect();
                }
                QueryItem::Row(row) if Some(row.result_index()) == result_index => {
                    if rows.len() >= 100_000 {
                        truncated = true;
                        continue;
                    }
                    rows.push(row.cells().map(|(_, value)| column_value(value)).collect());
                }
                _ => {}
            }
        }
        Ok::<_, tiberius::error::Error>((columns, rows, truncated))
    })
        .await
        .map_err(|_| "Sorgu zaman aşımına uğradı.".to_string())?
        .map_err(|error| translate_connection_error(&error_chain(&error)))?;
    let duration_ms = started.elapsed().as_millis();
    let message = if columns.is_empty() { format!("Sorgu başarıyla tamamlandı. ({duration_ms} ms)") } else { format!("{} satır döndü. ({duration_ms} ms)", rows.len()) };
    Ok(QueryExecutionResult { columns, rows, duration_ms, message, truncated })
}

#[tauri::command]
pub async fn discover_sql_instances(host: String) -> Result<Vec<SqlInstanceInfo>, String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .await
        .map_err(|error| format!("SQL Browser keşfi başlatılamadı: {error}"))?;
    socket
        .send_to(&[0x03], format!("{}:1434", host.trim()))
        .await
        .map_err(|error| format!("SQL Browser isteği gönderilemedi: {error}"))?;
    let mut buffer = vec![0u8; 8192];
    let (size, _) = tokio::time::timeout(Duration::from_secs(3), socket.recv_from(&mut buffer))
        .await
        .map_err(|_| "SQL Browser üç saniye içinde yanıt vermedi.".to_string())?
        .map_err(|error| format!("SQL Browser yanıtı alınamadı: {error}"))?;
    let response = String::from_utf8_lossy(&buffer[..size]);
    let mut instances = parse_sql_browser_response(&response);
    instances.sort_by(|left, right| left.name.cmp(&right.name));
    instances.dedup_by(|left, right| left.name.eq_ignore_ascii_case(&right.name));
    Ok(instances)
}

fn parse_sql_browser_response(response: &str) -> Vec<SqlInstanceInfo> {
    response
        .trim_matches(char::from(0))
        .split(";;")
        .filter_map(|record| {
            let values: Vec<&str> = record.split(';').collect();
            let value_for = |key: &str| {
                values
                    .chunks_exact(2)
                    .find(|pair| pair[0].eq_ignore_ascii_case(key))
                    .map(|pair| pair[1])
            };
            let name = value_for("InstanceName")?.trim();
            let port = value_for("tcp")?.trim().parse::<u16>().ok()?;
            (!name.is_empty()).then(|| SqlInstanceInfo { name: name.to_string(), port })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::parse_sql_browser_response;

    #[test]
    fn parses_named_instance_and_dynamic_port() {
        let instances = parse_sql_browser_response(
            "ServerName;MKA_WIN11;InstanceName;MSSQL;IsClustered;No;Version;17.0;tcp;64000;np;pipe\\sql\\query;;",
        );
        assert_eq!(instances.len(), 1);
        assert_eq!(instances[0].name, "MSSQL");
        assert_eq!(instances[0].port, 64000);
    }
}

