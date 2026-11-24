mod connections;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            connections::load_connection_profiles,
            connections::save_connection_profiles,
            connections::store_connection_password,
            connections::delete_connection_password,
            connections::test_sql_connection,
            connections::list_sql_databases,
            connections::discover_sql_instances,
        ])
        .run(tauri::generate_context!())
        .expect("error while running SqlStudio");
}
