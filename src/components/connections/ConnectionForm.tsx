import { ChevronDown, LoaderCircle, Plus, Radar, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { buildConnectionUrl, parseConnectionUrl, splitServerName } from "../../lib/connection-url";
import type { AdvancedProperty, ConnectionProfile } from "../../types/connections";

type Tab = "general" | "options" | "ssh" | "schemas" | "advanced";

interface Props {
  profile: ConnectionProfile;
  password: string;
  errors: Record<string, string>;
  instances: string[];
  databases: string[];
  busyAction: "test" | "instances" | "databases" | null;
  onChange: (profile: ConnectionProfile) => void;
  onPasswordChange: (password: string) => void;
  onDiscoverInstances: () => void;
  onLoadDatabases: () => void;
}

const tabs: Array<[Tab, string]> = [["general", "Genel"], ["options", "Seçenekler"], ["ssh", "SSH/SSL"], ["schemas", "Şemalar"], ["advanced", "Gelişmiş"]];

export function ConnectionForm(props: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const { profile, onChange } = props;
  const update = <K extends keyof ConnectionProfile>(key: K, value: ConnectionProfile[K], updateUrl = false) => {
    const next = { ...profile, [key]: value };
    if (updateUrl) next.url = buildConnectionUrl(next);
    onChange(next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="space-y-3 border-b border-border px-5 py-4">
        <div className="grid grid-cols-[75px_1fr_auto] items-center gap-3">
          <label htmlFor="connection-name" className="text-xs font-medium">Ad</label>
          <input id="connection-name" value={profile.name} onChange={(event) => update("name", event.target.value)} className={inputClass(props.errors.name)} />
          <span className="flex items-center gap-2 text-[11px] text-muted"><span className="h-2.5 w-2.5 rounded-full border border-muted" /> Bağlı değil</span>
          {props.errors.name && <span className="col-start-2 text-[10px] text-red-400">{props.errors.name}</span>}
        </div>
        <div className="grid grid-cols-[75px_1fr] items-start gap-3">
          <label htmlFor="connection-description" className="pt-2 text-xs font-medium">Açıklama</label>
          <textarea id="connection-description" rows={2} value={profile.description} onChange={(event) => update("description", event.target.value)} className={`${inputClass()} resize-y py-2`} />
        </div>
        <div className="grid grid-cols-[75px_1fr] items-center gap-3">
          <label htmlFor="environment" className="text-xs font-medium">Ortam</label>
          <div className="flex items-center gap-2">
            <select id="environment" value={profile.environment} onChange={(event) => update("environment", event.target.value as ConnectionProfile["environment"])} className={inputClass()}>
              <option value="development">Geliştirme</option><option value="test">Test</option><option value="production">Prod</option><option value="custom">Özel</option>
            </select>
            <input aria-label="Renk etiketi" type="color" value={profile.color} onChange={(event) => update("color", event.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5" />
            {profile.environment === "production" && <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-400">ÜRETİM</span>}
          </div>
        </div>
      </div>
      <nav className="flex h-11 items-end gap-1 border-b border-border px-4">
        {tabs.map(([value, label]) => <button type="button" key={value} onClick={() => setTab(value)} className={`h-10 border-b-2 px-3 text-xs font-medium transition ${tab === value ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}>{label}</button>)}
      </nav>
      <div className="min-h-0 flex-1 overflow-auto p-5">
        {tab === "general" && <GeneralTab {...props} update={update} />}
        {tab === "options" && <OptionsTab profile={profile} update={update} />}
        {tab === "ssh" && <SecurityTab profile={profile} onChange={onChange} />}
        {tab === "schemas" && <SchemasTab profile={profile} databases={props.databases} onChange={onChange} />}
        {tab === "advanced" && <AdvancedTab profile={profile} onChange={onChange} />}
      </div>
    </div>
  );
}

function GeneralTab({ profile, password, errors, instances, databases, busyAction, update, onChange, onPasswordChange, onDiscoverInstances, onLoadDatabases }: Props & { update: <K extends keyof ConnectionProfile>(key: K, value: ConnectionProfile[K], updateUrl?: boolean) => void }) {
  const authNeedsCredentials = profile.authType === "sqlServer" || profile.authType === "azureAdPassword";
  const applyUrl = (url: string) => {
    const parsed = parseConnectionUrl(url);
    update("url", url);
    if (parsed) {
      update("host", parsed.host);
      update("port", parsed.port);
      update("instance", parsed.instance);
      update("database", parsed.database);
    }
  };
  return <div className="mx-auto max-w-[760px] space-y-4">
    <div className="flex items-center gap-5 rounded-lg border border-border bg-panel/60 px-4 py-3 text-[11px]"><span>Bağlantı türü: <b>varsayılan</b></span><span>Sürücü: <button className="text-accent hover:underline">Microsoft SQL Server</button></span><span className="ml-auto text-accent">Diğer seçenekler <ChevronDown className="inline h-3 w-3" /></span></div>
    <div className="grid grid-cols-[130px_1fr_95px_130px] items-center gap-x-3 gap-y-3">
      <Label htmlFor="host">Sunucu</Label><div><input id="host" value={profile.host} onChange={(event) => { const server = splitServerName(event.target.value); const next = { ...profile, host: server.host, instance: server.instance || profile.instance }; onChange({ ...next, url: buildConnectionUrl(next) }); }} placeholder="SUNUCU veya SUNUCU\\INSTANCE" className={inputClass(errors.host)} />{errors.host && <ErrorText>{errors.host}</ErrorText>}</div>
      <Label htmlFor="port">Port</Label><div><input id="port" type="number" min={1} max={65535} placeholder="1433" value={profile.port || ""} onChange={(event) => update("port", Number(event.target.value), true)} className={inputClass(errors.port)} />{errors.port && <ErrorText>{errors.port}</ErrorText>}</div>
      <Label htmlFor="instance">Örnek (Instance)</Label><div className="relative"><input id="instance" list="instance-list" value={profile.instance} onChange={(event) => update("instance", event.target.value, true)} className={inputClass()} /><datalist id="instance-list">{instances.map((item) => <option key={item} value={item} />)}</datalist></div>
      <span /><button type="button" onClick={onDiscoverInstances} disabled={busyAction !== null} className="secondary-button">{busyAction === "instances" ? <LoaderCircle className="animate-spin" /> : <Radar />} Keşfet</button>
      <Label htmlFor="auth">Kimlik doğrulama</Label><select id="auth" value={profile.authType} onChange={(event) => update("authType", event.target.value as ConnectionProfile["authType"])} className={`${inputClass()} col-span-3`}><option value="integrated">Windows kimlik bilgileri</option><option value="sqlServer">Kullanıcı adı ve parola</option><option value="azureAdPassword">Kullanıcı adı ve parola (Azure AD)</option><option value="none">Kimlik doğrulama yok</option></select>
      {profile.authType === "integrated" && <><span /><p className="col-span-3 -mt-1 text-[10px] leading-4 text-muted">Bu seçenek, uygulamayı açtığınız Windows hesabını kullanır. SSMS bağlantınızda kullanıcı adı <b className="text-foreground">sa</b> görünüyorsa “Kullanıcı adı ve parola” seçeneğini kullanın.</p></>}
      {authNeedsCredentials && <><Label htmlFor="username">Kullanıcı adı</Label><div className="col-span-3"><input id="username" autoComplete="username" value={profile.username} onChange={(event) => update("username", event.target.value)} className={inputClass(errors.username)} />{errors.username && <ErrorText>{errors.username}</ErrorText>}</div><Label htmlFor="password">Parola</Label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} className={`${inputClass()} col-span-2`} /><select aria-label="Parolayı kaydet" value={profile.savePassword} onChange={(event) => update("savePassword", event.target.value as ConnectionProfile["savePassword"])} className={inputClass()}><option value="always">Her zaman kaydet</option><option value="session">Oturum boyunca</option><option value="never">Asla kaydetme</option></select></>}
      <Label htmlFor="database">Veritabanı</Label><div className="col-span-2"><input id="database" list="database-list" value={profile.database} onChange={(event) => update("database", event.target.value, true)} className={inputClass()} /><datalist id="database-list">{databases.map((item) => <option key={item} value={item} />)}</datalist></div><button type="button" onClick={onLoadDatabases} disabled={busyAction !== null} className="secondary-button">{busyAction === "databases" ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} Listele</button>
      <Label htmlFor="url">URL</Label><div className="col-span-3"><textarea id="url" rows={2} value={profile.url} onChange={(event) => applyUrl(event.target.value)} className={`${inputClass()} resize-y py-2 font-mono text-[11px]`} /><p className="mt-1 text-[10px] text-muted">Yukarıdaki ayarları geçersiz kılar. JDBC SQL Server adresleri de içe aktarılabilir.</p></div>
    </div>
  </div>;
}

function OptionsTab({ profile, update }: { profile: ConnectionProfile; update: <K extends keyof ConnectionProfile>(key: K, value: ConnectionProfile[K]) => void }) {
  return <div className="mx-auto grid max-w-[680px] grid-cols-[190px_1fr] items-center gap-4"><Label htmlFor="connect-timeout">Bağlantı zaman aşımı (sn)</Label><input id="connect-timeout" type="number" min={1} value={profile.connectTimeoutSeconds} onChange={(e) => update("connectTimeoutSeconds", Number(e.target.value))} className={inputClass()} /><Label htmlFor="query-timeout">Sorgu zaman aşımı (sn)</Label><input id="query-timeout" type="number" min={1} value={profile.queryTimeoutSeconds} onChange={(e) => update("queryTimeoutSeconds", Number(e.target.value))} className={inputClass()} /><Label htmlFor="app-name">Uygulama adı</Label><input id="app-name" value={profile.applicationName} onChange={(e) => update("applicationName", e.target.value)} className={inputClass()} /><Label htmlFor="schema">Varsayılan şema</Label><input id="schema" value={profile.defaultSchema} onChange={(e) => update("defaultSchema", e.target.value)} className={inputClass()} /><Label htmlFor="pool">Bağlantı havuzu boyutu</Label><input id="pool" type="number" min={1} value={profile.poolSize} onChange={(e) => update("poolSize", Number(e.target.value))} className={inputClass()} /><Label htmlFor="startup-sql">Bağlanınca çalışacak SQL</Label><textarea id="startup-sql" rows={4} value={profile.startupSql} onChange={(e) => update("startupSql", e.target.value)} className={`${inputClass()} py-2 font-mono`} /><span /><div className="flex gap-6"><Check checked={profile.readonly} onChange={(value) => update("readonly", value)}>Salt okunur</Check><Check checked={profile.autoCommit ?? true} onChange={(value) => update("autoCommit", value)}>Otomatik commit</Check></div></div>;
}

function SecurityTab({ profile, onChange }: { profile: ConnectionProfile; onChange: (profile: ConnectionProfile) => void }) {
  const ssh = (key: keyof ConnectionProfile["ssh"], value: string | number | boolean) => onChange({ ...profile, ssh: { ...profile.ssh, [key]: value } });
  return <div className="mx-auto max-w-[680px] space-y-6"><Section title="SSH tüneli"><Check checked={profile.ssh.enabled} onChange={(value) => ssh("enabled", value)}>SSH tüneli kullan</Check><div className="mt-4 grid grid-cols-[150px_1fr_90px_110px] items-center gap-3 opacity-100"><Label htmlFor="ssh-host">SSH sunucusu</Label><input id="ssh-host" disabled={!profile.ssh.enabled} value={profile.ssh.host} onChange={(e) => ssh("host", e.target.value)} className={inputClass()} /><Label htmlFor="ssh-port">Port</Label><input id="ssh-port" disabled={!profile.ssh.enabled} type="number" value={profile.ssh.port} onChange={(e) => ssh("port", Number(e.target.value))} className={inputClass()} /><Label htmlFor="ssh-user">Kullanıcı</Label><input id="ssh-user" disabled={!profile.ssh.enabled} value={profile.ssh.username} onChange={(e) => ssh("username", e.target.value)} className={`${inputClass()} col-span-3`} /><Label htmlFor="ssh-auth">Doğrulama</Label><select id="ssh-auth" disabled={!profile.ssh.enabled} value={profile.ssh.authMethod} onChange={(e) => ssh("authMethod", e.target.value)} className={`${inputClass()} col-span-3`}><option value="password">Parola</option><option value="privateKey">Özel anahtar</option></select>{profile.ssh.authMethod === "privateKey" && <><Label htmlFor="ssh-key">Özel anahtar</Label><input id="ssh-key" disabled={!profile.ssh.enabled} value={profile.ssh.privateKeyPath} onChange={(e) => ssh("privateKeyPath", e.target.value)} placeholder="Dosya yolu" className={`${inputClass()} col-span-3`} /></>}</div></Section><Section title="SSL / TLS"><div className="space-y-3"><Check checked={profile.encrypt} onChange={(value) => onChange({ ...profile, encrypt: value })}>Bağlantıyı şifrele</Check><Check checked={profile.trustServerCertificate} onChange={(value) => onChange({ ...profile, trustServerCertificate: value })}>Sunucu sertifikasına güven</Check><div className="grid grid-cols-[150px_1fr] items-center gap-3"><Label htmlFor="ca-path">CA sertifikası</Label><input id="ca-path" value={profile.caCertificatePath} onChange={(e) => onChange({ ...profile, caCertificatePath: e.target.value })} placeholder="Dosya yolu" className={inputClass()} /></div></div></Section></div>;
}

function SchemasTab({ profile, databases, onChange }: { profile: ConnectionProfile; databases: string[]; onChange: (profile: ConnectionProfile) => void }) {
  const available = databases.length ? databases : [profile.database || "master", "tempdb", "model", "msdb"];
  const visible = profile.hideSystemDatabases ? available.filter((item) => !["master", "tempdb", "model", "msdb"].includes(item)) : available;
  const toggle = (name: string) => onChange({ ...profile, schemas: profile.schemas.includes(name) ? profile.schemas.filter((item) => item !== name) : [...profile.schemas, name] });
  return <div className="mx-auto max-w-[680px]"><div className="mb-4 flex items-center justify-between"><Check checked={profile.hideSystemDatabases} onChange={(value) => onChange({ ...profile, hideSystemDatabases: value })}>Sistem veritabanlarını gizle</Check><button type="button" onClick={() => onChange({ ...profile, schemas: visible })} className="text-xs text-accent">Tümünü seç</button></div><div className="rounded-lg border border-border bg-panel p-2">{visible.map((name) => <label key={name} className="flex items-center gap-2 rounded px-3 py-2 text-xs hover:bg-elevated"><input type="checkbox" checked={profile.schemas.includes(name)} onChange={() => toggle(name)} /><span className="text-muted">▾</span><span>{name}</span><span className="text-muted">/ dbo</span></label>)}{visible.length === 0 && <p className="p-6 text-center text-xs text-muted">Önce Genel sekmesinden veritabanlarını listeleyin.</p>}</div></div>;
}

function AdvancedTab({ profile, onChange }: { profile: ConnectionProfile; onChange: (profile: ConnectionProfile) => void }) {
  const update = (index: number, patch: Partial<AdvancedProperty>) => onChange({ ...profile, advanced: profile.advanced.map((item, i) => i === index ? { ...item, ...patch } : item) });
  return <div className="mx-auto max-w-[720px] space-y-4"><div className="flex items-center justify-between"><p className="text-xs text-muted">Ek tiberius bağlantı parametreleri</p><button type="button" onClick={() => onChange({ ...profile, advanced: [...profile.advanced, { key: "", value: "" }] })} className="secondary-button"><Plus /> Parametre ekle</button></div><div className="overflow-hidden rounded-lg border border-border"><div className="grid grid-cols-[1fr_1fr_38px] bg-panel px-3 py-2 text-[10px] font-semibold uppercase text-muted"><span>Anahtar</span><span>Değer</span><span /></div>{profile.advanced.map((item, index) => <div key={index} className="grid grid-cols-[1fr_1fr_38px] gap-2 border-t border-border p-2"><input aria-label="Parametre anahtarı" value={item.key} onChange={(e) => update(index, { key: e.target.value })} className={inputClass()} /><input aria-label="Parametre değeri" value={item.value} onChange={(e) => update(index, { value: e.target.value })} className={inputClass()} /><button type="button" onClick={() => onChange({ ...profile, advanced: profile.advanced.filter((_, i) => i !== index) })} className="text-muted hover:text-red-400"><Trash2 className="mx-auto h-4 w-4" /></button></div>)}</div><div className="grid grid-cols-[160px_1fr] items-center gap-3"><Label htmlFor="language">Dil</Label><input id="language" value={profile.language} onChange={(e) => onChange({ ...profile, language: e.target.value })} className={inputClass()} /><Label htmlFor="date-format">Tarih biçimi</Label><input id="date-format" value={profile.dateFormat} onChange={(e) => onChange({ ...profile, dateFormat: e.target.value })} className={inputClass()} /></div></div>;
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) { return <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">{children}</label>; }
function ErrorText({ children }: { children: React.ReactNode }) { return <p className="mt-1 text-[10px] text-red-400">{children}</p>; }
function Check({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) { return <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-500" />{children}</label>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="rounded-lg border border-border p-4"><legend className="px-2 text-xs font-semibold">{title}</legend>{children}</fieldset>; }
function inputClass(error?: string) { return `h-8 w-full rounded-md border bg-panel px-2.5 text-xs text-foreground outline-none transition placeholder:text-muted/70 focus:ring-2 focus:ring-accent/25 ${error ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"}`; }
