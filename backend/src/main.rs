use axum::{routing::get, Router, Json};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::cors::{CorsLayer, Any};

#[derive(Serialize)]
struct HealthResponse {
    status: String,
}

async fn health_handler() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
    })
}

#[tokio::main]
async fn main() {
    // CORS設定
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // ルーティング設定
    let app = Router::new()
        .route("/health", get(health_handler))
        .layer(cors);

    // サーバー起動
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
