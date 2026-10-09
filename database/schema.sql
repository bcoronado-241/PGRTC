CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'rescuer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS centers (
    id SERIAL PRIMARY KEY,
    center_name VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'green',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplies (
    id SERIAL PRIMARY KEY,
    supply_name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    center_id INT NOT NULL,
    supply_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_threshold INT NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'green',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_center FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_supply FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE RESTRICT,
    CONSTRAINT uq_center_supply UNIQUE (center_id, supply_id)
);

CREATE TABLE IF NOT EXISTS redistribution_requests (
    id SERIAL PRIMARY KEY,
    source_center_id INT NOT NULL,
    target_center_id INT NOT NULL,
    supply_id INT NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    CONSTRAINT fk_source_center FOREIGN KEY (source_center_id) REFERENCES centers(id),
    CONSTRAINT fk_target_center FOREIGN KEY (target_center_id) REFERENCES centers(id),
    CONSTRAINT fk_redistribution_supply FOREIGN KEY (supply_id) REFERENCES supplies(id),
    CONSTRAINT fk_requested_by FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    center_id INT NOT NULL,
    supply_id INT NOT NULL,
    alert_level VARCHAR(10) NOT NULL,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_center FOREIGN KEY (center_id) REFERENCES centers(id),
    CONSTRAINT fk_alert_supply FOREIGN KEY (supply_id) REFERENCES supplies(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_center_id ON inventory(center_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supply_id ON inventory(supply_id);
CREATE INDEX IF NOT EXISTS idx_alerts_center_id ON alerts(center_id);
CREATE INDEX IF NOT EXISTS idx_redistribution_status ON redistribution_requests(status);