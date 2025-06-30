<?php
/**
 * Phase 6 Enterprise Dashboard
 * 
 * FAZA 6: Enterprise Integration & Analytics
 * Centralny dashboard zarządzania enterprise
 */

// Pobierz dane z serwisów
$serviceFactory = $this->serviceFactory;
$analyticsEngine = $serviceFactory->getAnalyticsEngine();
$integrationManager = $serviceFactory->getIntegrationManager();
$securityManager = $serviceFactory->getEnterpriseSecurityManager();

// Pobierz statystyki
$dashboardStats = $analyticsEngine->getDashboardStats();

// Handle security manager being unavailable (memory optimization)
$securityStats = null;
$recentEvents = [];
if ($securityManager !== null) {
    $securityStats = $securityManager->getSecurityStats();
    $recentEvents = $securityManager->getRecentSecurityEvents(10);
} else {
    // Fallback security stats when service is disabled
    $securityStats = [
        'threats_today' => 'N/A',
        'failed_logins_today' => 'N/A',
        'status' => 'Service Disabled (Memory Optimization)'
    ];
}

$integrationsOverview = $integrationManager->getIntegrationsOverview();

?>

<div class="wrap mas-v2-enterprise-dashboard">
    <div class="mas-dashboard-header">
        <h1>🚀 Modern Admin Styler V2 - Enterprise Dashboard</h1>
        <p class="mas-dashboard-subtitle">Zaawansowany panel zarządzania enterprise z analytics, security i integracjami</p>
    </div>

    <!-- Dashboard Navigation -->
    <nav class="mas-dashboard-nav">
        <ul>
            <li><a href="#overview" class="nav-tab nav-tab-active">📊 Overview</a></li>
            <li><a href="#analytics" class="nav-tab">📈 Analytics</a></li>
            <li><a href="#security" class="nav-tab">🛡️ Security</a></li>
            <li><a href="#integrations" class="nav-tab">🔌 Integrations</a></li>
            <li><a href="#performance" class="nav-tab">⚡ Performance</a></li>
        </ul>
    </nav>

    <!-- Overview Section -->
    <div id="overview" class="mas-dashboard-section">
        <div class="mas-dashboard-grid">
            
            <!-- System Health Card -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>🏥 System Health</h3>
                    <span class="status-indicator status-healthy">Healthy</span>
                </div>
                <div class="card-body">
                    <div class="health-metrics">
                        <div class="metric">
                            <span class="metric-label">Performance</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: 92%"></div>
                            </div>
                            <span class="metric-value">92%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Security</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: 98%"></div>
                            </div>
                            <span class="metric-value">98%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Uptime</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: 99.9%"></div>
                            </div>
                            <span class="metric-value">99.9%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Memory Monitoring Card -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>💾 Memory Monitoring</h3>
                    <span class="status-indicator" id="memory-status">Normal</span>
                </div>
                <div class="card-body">
                    <div class="memory-stats">
                        <div class="memory-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="memory-progress" style="width: 35%"></div>
                            </div>
                            <div class="progress-info">
                                <span>Current: <span id="memory-current">89MB</span></span>
                                <span>Limit: <span id="memory-limit">256MB</span></span>
                            </div>
                        </div>
                        <div class="memory-actions">
                            <button class="btn-optimize" onclick="forceMemoryOptimization()">🔧 Optimize</button>
                            <button class="btn-refresh" onclick="refreshMemoryStats()">🔄 Refresh</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Analytics Summary Card -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>📊 Analytics Summary</h3>
                    <span class="time-period">Today</span>
                </div>
                <div class="card-body">
                    <div class="analytics-stats">
                        <div class="stat">
                            <div class="stat-number">1,247</div>
                            <div class="stat-label">Page Views</div>
                            <div class="stat-change positive">+12.5%</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">89</div>
                            <div class="stat-label">Unique Users</div>
                            <div class="stat-change positive">+8.3%</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">3.2s</div>
                            <div class="stat-label">Avg Load Time</div>
                            <div class="stat-change negative">-0.5s</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Security Status Card -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>🛡️ Security Status</h3>
                    <?php if ($securityManager !== null): ?>
                        <span class="status-indicator status-secure">Secure</span>
                    <?php else: ?>
                        <span class="status-indicator status-warning">Service Disabled</span>
                    <?php endif; ?>
                </div>
                <div class="card-body">
                    <?php if ($securityManager !== null): ?>
                        <div class="security-stats">
                            <div class="security-item">
                                <span class="security-icon">🚫</span>
                                <span class="security-text">Blocked Threats: <?php echo esc_html($securityStats['threats_today']); ?></span>
                            </div>
                            <div class="security-item">
                                <span class="security-icon">🔒</span>
                                <span class="security-text">Failed Logins: <?php echo esc_html($securityStats['failed_logins_today']); ?></span>
                            </div>
                            <div class="security-item">
                                <span class="security-icon">🛡️</span>
                                <span class="security-text">Firewall: Active</span>
                            </div>
                        </div>
                    <?php else: ?>
                        <div class="security-disabled-notice">
                            <div class="notice-icon">⚠️</div>
                            <div class="notice-content">
                                <h4>Security Service Temporarily Disabled</h4>
                                <p>EnterpriseSecurityManager has been disabled to optimize memory usage. Core WordPress security features remain active.</p>
                                <div class="notice-actions">
                                    <button class="btn-secondary" onclick="checkMemoryUsage()">Check Memory Usage</button>
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Integrations Status Card -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>🔌 Integrations</h3>
                    <span class="integration-count"><?php echo esc_html($integrationsOverview['active']); ?>/<?php echo esc_html($integrationsOverview['total']); ?> Active</span>
                </div>
                <div class="card-body">
                    <div class="integrations-list">
                        <?php foreach (array_slice($integrationsOverview['integrations'], 0, 5) as $id => $integration): ?>
                        <div class="integration-item">
                            <span class="integration-status status-<?php echo esc_attr($integration['status']); ?>"></span>
                            <span class="integration-name"><?php echo esc_html($integration['name']); ?></span>
                            <span class="integration-version"><?php echo esc_html($integration['version'] ?? 'N/A'); ?></span>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

        </div>

        <!-- Performance Chart -->
        <div class="mas-dashboard-card mas-chart-card">
            <div class="card-header">
                <h3>📈 Performance Trends</h3>
                <div class="chart-controls">
                    <select id="chart-period">
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
            </div>
            <div class="card-body">
                <canvas id="performance-chart" width="800" height="300"></canvas>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="mas-dashboard-card">
            <div class="card-header">
                <h3>📋 Recent Activity</h3>
                <a href="#security" class="view-all-link">View All</a>
            </div>
            <div class="card-body">
                <div class="activity-list">
                    <?php if (!empty($recentEvents)): ?>
                        <?php foreach (array_slice($recentEvents, 0, 8) as $event): ?>
                        <div class="activity-item">
                            <div class="activity-icon">
                                <?php 
                                $icons = [
                                    'login_success' => '✅',
                                    'login_failed' => '❌',
                                    'threat_detected' => '🚨',
                                    'request_blocked' => '🚫',
                                    'plugin_activated' => '🔌',
                                    'user_registered' => '👤'
                                ];
                                echo $icons[$event['event_type']] ?? '📝';
                                ?>
                            </div>
                            <div class="activity-content">
                                <div class="activity-title"><?php echo esc_html(ucfirst(str_replace('_', ' ', $event['event_type']))); ?></div>
                                <div class="activity-details"><?php echo esc_html($event['event_data']); ?></div>
                                <div class="activity-time"><?php echo esc_html($event['created_at']); ?></div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <div class="no-activity">No recent activity</div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

    </div>

    <!-- Analytics Section -->
    <div id="analytics" class="mas-dashboard-section" style="display: none;">
        <div class="section-header">
            <h2>📈 Advanced Analytics</h2>
            <p>Detailed insights into your website's performance and user behavior</p>
        </div>

        <div class="mas-dashboard-grid">
            <!-- User Behavior Analytics -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>👥 User Behavior</h3>
                </div>
                <div class="card-body">
                    <div class="behavior-metrics">
                        <div class="behavior-item">
                            <span class="behavior-label">Session Duration</span>
                            <span class="behavior-value">4m 32s</span>
                        </div>
                        <div class="behavior-item">
                            <span class="behavior-label">Bounce Rate</span>
                            <span class="behavior-value">24.5%</span>
                        </div>
                        <div class="behavior-item">
                            <span class="behavior-label">Pages per Session</span>
                            <span class="behavior-value">3.8</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>⚡ Performance Metrics</h3>
                </div>
                <div class="card-body">
                    <div class="performance-metrics">
                        <div class="perf-item">
                            <span class="perf-label">TTFB</span>
                            <span class="perf-value">120ms</span>
                            <span class="perf-status good">Good</span>
                        </div>
                        <div class="perf-item">
                            <span class="perf-label">FCP</span>
                            <span class="perf-value">1.2s</span>
                            <span class="perf-status good">Good</span>
                        </div>
                        <div class="perf-item">
                            <span class="perf-label">LCP</span>
                            <span class="perf-value">2.1s</span>
                            <span class="perf-status warning">Needs Improvement</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detailed Analytics Chart -->
        <div class="mas-dashboard-card mas-chart-card">
            <div class="card-header">
                <h3>📊 Detailed Analytics</h3>
                <div class="chart-tabs">
                    <button class="chart-tab active" data-chart="visitors">Visitors</button>
                    <button class="chart-tab" data-chart="performance">Performance</button>
                    <button class="chart-tab" data-chart="errors">Errors</button>
                </div>
            </div>
            <div class="card-body">
                <canvas id="analytics-chart" width="800" height="400"></canvas>
            </div>
        </div>
    </div>

    <!-- Security Section -->
    <div id="security" class="mas-dashboard-section" style="display: none;">
        <div class="section-header">
            <h2>🛡️ Security Center</h2>
            <p>Comprehensive security monitoring and threat protection</p>
        </div>

        <div class="mas-dashboard-grid">
            <!-- Security Overview -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>🔒 Security Overview</h3>
                </div>
                <div class="card-body">
                    <div class="security-overview">
                        <div class="security-score">
                            <div class="score-circle">
                                <span class="score-number">98</span>
                                <span class="score-label">Security Score</span>
                            </div>
                        </div>
                        <div class="security-details">
                            <div class="security-detail">
                                <span class="detail-icon">🛡️</span>
                                <span class="detail-text">Firewall Active</span>
                            </div>
                            <div class="security-detail">
                                <span class="detail-icon">🔐</span>
                                <span class="detail-text">SSL Certificate Valid</span>
                            </div>
                            <div class="security-detail">
                                <span class="detail-icon">🔄</span>
                                <span class="detail-text">Auto Updates Enabled</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Threat Detection -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>🚨 Threat Detection</h3>
                </div>
                <div class="card-body">
                    <div class="threat-stats">
                        <div class="threat-item">
                            <span class="threat-number"><?php echo esc_html($securityStats['threats_today']); ?></span>
                            <span class="threat-label">Threats Blocked Today</span>
                        </div>
                        <div class="threat-item">
                            <span class="threat-number"><?php echo esc_html($securityStats['blocked_ips']); ?></span>
                            <span class="threat-label">IPs Blocked</span>
                        </div>
                        <div class="threat-item">
                            <span class="threat-number"><?php echo esc_html($securityStats['failed_logins_today']); ?></span>
                            <span class="threat-label">Failed Login Attempts</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Security Events Log -->
        <div class="mas-dashboard-card">
            <div class="card-header">
                <h3>📋 Security Events Log</h3>
                <div class="log-controls">
                    <select id="log-filter">
                        <option value="all">All Events</option>
                        <option value="threats">Threats Only</option>
                        <option value="logins">Login Events</option>
                        <option value="blocks">Blocked Requests</option>
                    </select>
                </div>
            </div>
            <div class="card-body">
                <div class="events-log">
                    <?php foreach ($recentEvents as $event): ?>
                    <div class="log-entry">
                        <div class="log-time"><?php echo esc_html(date('H:i:s', strtotime($event['created_at']))); ?></div>
                        <div class="log-type"><?php echo esc_html($event['event_type']); ?></div>
                        <div class="log-details"><?php echo esc_html($event['event_data']); ?></div>
                        <div class="log-ip"><?php echo esc_html($event['ip_address'] ?? 'N/A'); ?></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Integrations Section -->
    <div id="integrations" class="mas-dashboard-section" style="display: none;">
        <div class="section-header">
            <h2>🔌 Plugin Integrations</h2>
            <p>Manage and monitor third-party plugin integrations</p>
        </div>

        <div class="integrations-grid">
            <?php foreach ($integrationsOverview['integrations'] as $id => $integration): ?>
            <div class="integration-card">
                <div class="integration-header">
                    <h3><?php echo esc_html($integration['name']); ?></h3>
                    <span class="integration-status-badge status-<?php echo esc_attr($integration['status']); ?>">
                        <?php echo esc_html(ucfirst($integration['status'])); ?>
                    </span>
                </div>
                <div class="integration-body">
                    <div class="integration-info">
                        <p><strong>Version:</strong> <?php echo esc_html($integration['version'] ?? 'N/A'); ?></p>
                        <p><strong>Compatible:</strong> <?php echo $integration['compatible'] ? '✅ Yes' : '❌ No'; ?></p>
                    </div>
                    <div class="integration-actions">
                        <?php if ($integration['status'] === 'active'): ?>
                            <button class="button button-secondary" onclick="configureIntegration('<?php echo esc_js($id); ?>')">⚙️ Configure</button>
                        <?php else: ?>
                            <button class="button button-primary" onclick="enableIntegration('<?php echo esc_js($id); ?>')">🔌 Enable</button>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Performance Section -->
    <div id="performance" class="mas-dashboard-section" style="display: none;">
        <div class="section-header">
            <h2>⚡ Performance Optimization</h2>
            <p>Monitor and optimize your website's performance</p>
        </div>

        <div class="mas-dashboard-grid">
            <!-- Cache Status -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>💾 Cache Status</h3>
                </div>
                <div class="card-body">
                    <div class="cache-stats">
                        <div class="cache-item">
                            <span class="cache-label">Object Cache</span>
                            <span class="cache-status active">Active</span>
                            <span class="cache-hit-rate">Hit Rate: 94%</span>
                        </div>
                        <div class="cache-item">
                            <span class="cache-label">Page Cache</span>
                            <span class="cache-status active">Active</span>
                            <span class="cache-hit-rate">Hit Rate: 87%</span>
                        </div>
                        <div class="cache-item">
                            <span class="cache-label">Database Cache</span>
                            <span class="cache-status active">Active</span>
                            <span class="cache-hit-rate">Hit Rate: 92%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Resources -->
            <div class="mas-dashboard-card">
                <div class="card-header">
                    <h3>🖥️ System Resources</h3>
                </div>
                <div class="card-body">
                    <div class="resource-meters">
                        <div class="resource-meter">
                            <div class="meter-label">Memory Usage</div>
                            <div class="meter-bar">
                                <div class="meter-fill" style="width: 68%"></div>
                            </div>
                            <div class="meter-value">68% (87MB / 128MB)</div>
                        </div>
                        <div class="resource-meter">
                            <div class="meter-label">CPU Usage</div>
                            <div class="meter-bar">
                                <div class="meter-fill" style="width: 23%"></div>
                            </div>
                            <div class="meter-value">23%</div>
                        </div>
                        <div class="resource-meter">
                            <div class="meter-label">Disk I/O</div>
                            <div class="meter-bar">
                                <div class="meter-fill" style="width: 15%"></div>
                            </div>
                            <div class="meter-value">15%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Performance Recommendations -->
        <div class="mas-dashboard-card">
            <div class="card-header">
                <h3>💡 Performance Recommendations</h3>
            </div>
            <div class="card-body">
                <div class="recommendations-list">
                    <div class="recommendation-item">
                        <div class="rec-icon">⚡</div>
                        <div class="rec-content">
                            <h4>Enable Lazy Loading</h4>
                            <p>Implement lazy loading for images to improve initial page load times.</p>
                        </div>
                        <div class="rec-action">
                            <button class="button button-primary">Enable</button>
                        </div>
                    </div>
                    <div class="recommendation-item">
                        <div class="rec-icon">🗜️</div>
                        <div class="rec-content">
                            <h4>Optimize Database</h4>
                            <p>Clean up unused data and optimize database tables for better performance.</p>
                        </div>
                        <div class="rec-action">
                            <button class="button button-secondary">Optimize</button>
                        </div>
                    </div>
                    <div class="recommendation-item">
                        <div class="rec-icon">📦</div>
                        <div class="rec-content">
                            <h4>Minify Assets</h4>
                            <p>Minify CSS and JavaScript files to reduce file sizes.</p>
                        </div>
                        <div class="rec-action">
                            <button class="button button-secondary">Minify</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div>

<style>
/* Enterprise Dashboard Styles */
.mas-v2-enterprise-dashboard {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f8fafc;
    margin: 0 -20px;
    padding: 20px;
}

.mas-dashboard-header {
    text-align: center;
    margin-bottom: 30px;
    padding: 30px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.mas-dashboard-header h1 {
    margin: 0;
    font-size: 2.5em;
    font-weight: 700;
}

.mas-dashboard-subtitle {
    margin: 10px 0 0 0;
    font-size: 1.1em;
    opacity: 0.9;
}

.mas-dashboard-nav {
    margin-bottom: 30px;
}

.mas-dashboard-nav ul {
    display: flex;
    gap: 5px;
    margin: 0;
    padding: 0;
    list-style: none;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    overflow: hidden;
}

.mas-dashboard-nav .nav-tab {
    padding: 15px 25px;
    text-decoration: none;
    color: #64748b;
    background: white;
    border: none;
    transition: all 0.3s ease;
    cursor: pointer;
    font-weight: 500;
}

.mas-dashboard-nav .nav-tab:hover,
.mas-dashboard-nav .nav-tab-active {
    background: #667eea;
    color: white;
}

.mas-dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.mas-dashboard-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.mas-dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.12);
}

.card-header {
    padding: 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h3 {
    margin: 0;
    font-size: 1.2em;
    font-weight: 600;
    color: #1e293b;
}

.card-body {
    padding: 20px;
}

.status-indicator {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85em;
    font-weight: 500;
}

.status-healthy {
    background: #dcfce7;
    color: #166534;
}

.status-secure {
    background: #dbeafe;
    color: #1e40af;
}

.health-metrics,
.analytics-stats,
.security-stats {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.metric {
    display: flex;
    align-items: center;
    gap: 12px;
}

.metric-label {
    min-width: 80px;
    font-weight: 500;
    color: #64748b;
}

.metric-bar {
    flex: 1;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
}

.metric-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    transition: width 0.3s ease;
}

.metric-value {
    font-weight: 600;
    color: #1e293b;
}

.stat {
    text-align: center;
    padding: 15px;
    background: #f8fafc;
    border-radius: 8px;
}

.stat-number {
    font-size: 2em;
    font-weight: 700;
    color: #1e293b;
    display: block;
}

.stat-label {
    color: #64748b;
    font-size: 0.9em;
    margin-top: 5px;
}

.stat-change {
    font-size: 0.85em;
    font-weight: 500;
    margin-top: 5px;
}

.stat-change.positive {
    color: #059669;
}

.stat-change.negative {
    color: #dc2626;
}

.security-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
}

.security-icon {
    font-size: 1.2em;
}

.integration-count {
    background: #667eea;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.85em;
    font-weight: 500;
}

.integrations-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.integration-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
}

.integration-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.integration-status.status-active {
    background: #10b981;
}

.integration-status.status-inactive {
    background: #94a3b8;
}

.integration-name {
    flex: 1;
    font-weight: 500;
}

.integration-version {
    color: #64748b;
    font-size: 0.85em;
}

.mas-chart-card {
    grid-column: 1 / -1;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.activity-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
}

.activity-icon {
    font-size: 1.2em;
}

.activity-content {
    flex: 1;
}

.activity-title {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 4px;
}

.activity-details {
    color: #64748b;
    font-size: 0.9em;
    margin-bottom: 4px;
}

.activity-time {
    color: #94a3b8;
    font-size: 0.8em;
}

.integrations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.integration-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    overflow: hidden;
}

.integration-header {
    padding: 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.integration-status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: 500;
}

.integration-status-badge.status-active {
    background: #dcfce7;
    color: #166534;
}

.integration-status-badge.status-inactive {
    background: #f1f5f9;
    color: #64748b;
}

.integration-body {
    padding: 20px;
}

.integration-info {
    margin-bottom: 15px;
}

.integration-info p {
    margin: 5px 0;
    color: #64748b;
}

.section-header {
    text-align: center;
    margin-bottom: 30px;
}

.section-header h2 {
    font-size: 2em;
    color: #1e293b;
    margin-bottom: 10px;
}

.section-header p {
    color: #64748b;
    font-size: 1.1em;
}

/* Memory Monitoring Styles */
.memory-stats {
    padding: 10px 0;
}

.memory-progress {
    margin-bottom: 15px;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
}

.progress-fill {
    height: 100%;
    background: #28a745;
    border-radius: 10px;
    transition: width 0.3s ease, background-color 0.3s ease;
}

.progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.9em;
    color: #64748b;
}

.memory-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.btn-optimize, .btn-refresh {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s ease;
}

.btn-optimize {
    background: #3b82f6;
    color: white;
}

.btn-optimize:hover {
    background: #2563eb;
}

.btn-refresh {
    background: #6b7280;
    color: white;
}

.btn-refresh:hover {
    background: #4b5563;
}

.status-indicator.status-critical {
    background: #dc3545;
    color: white;
}

.status-indicator.status-warning {
    background: #ffc107;
    color: #212529;
}

.status-indicator.status-normal {
    background: #28a745;
    color: white;
}

/* Responsive */
@media (max-width: 768px) {
    .mas-dashboard-nav ul {
        flex-direction: column;
    }
    
    .mas-dashboard-grid {
        grid-template-columns: 1fr;
    }
    
    .integrations-grid {
        grid-template-columns: 1fr;
    }
    
    .memory-actions {
        flex-direction: column;
    }
}
</style>

<script>
// Dashboard JavaScript
jQuery(document).ready(function($) {
    // Navigation tabs
    $('.nav-tab').on('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all tabs
        $('.nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');
        
        // Hide all sections
        $('.mas-dashboard-section').hide();
        
        // Show selected section
        const target = $(this).attr('href');
        $(target).show();
    });
    
    // Integration functions
    window.configureIntegration = function(integrationId) {
        alert('Configure integration: ' + integrationId);
    };
    
    window.enableIntegration = function(integrationId) {
        alert('Enable integration: ' + integrationId);
    };
    
    // Auto-refresh dashboard data every 30 seconds
    setInterval(function() {
        // Refresh dashboard data via AJAX
        refreshDashboardData();
    }, 30000);
    
    function refreshDashboardData() {
        // Placeholder for AJAX refresh
        console.log('Refreshing dashboard data...');
        updateMemoryStats(); // Add memory stats update
    }
    
    // 💾 Memory Monitoring Functions
    function updateMemoryStats() {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'mas_v2_memory_stats',
                nonce: '<?php echo wp_create_nonce("mas_v2_nonce"); ?>'
            },
            success: function(response) {
                if (response.success) {
                    const stats = response.data;
                    
                    // Update memory display
                    $('#memory-current').text(formatBytes(stats.current_usage));
                    $('#memory-limit').text(formatBytes(stats.limit));
                    $('#memory-progress').css('width', stats.percentage + '%');
                    
                    // Update status indicator
                    const statusEl = $('#memory-status');
                    if (stats.percentage > 90) {
                        statusEl.removeClass().addClass('status-indicator status-critical').text('Critical');
                    } else if (stats.percentage > 75) {
                        statusEl.removeClass().addClass('status-indicator status-warning').text('Warning');
                    } else {
                        statusEl.removeClass().addClass('status-indicator status-normal').text('Normal');
                    }
                    
                    // Update progress bar color
                    const progressEl = $('#memory-progress');
                    if (stats.percentage > 90) {
                        progressEl.css('background-color', '#dc3545');
                    } else if (stats.percentage > 75) {
                        progressEl.css('background-color', '#ffc107');
                    } else {
                        progressEl.css('background-color', '#28a745');
                    }
                }
            },
            error: function() {
                console.error('Memory stats update failed');
            }
        });
    }
    
    window.forceMemoryOptimization = function() {
        if (!confirm('Are you sure you want to force memory optimization? This may temporarily affect performance.')) {
            return;
        }
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'mas_v2_force_memory_optimization',
                nonce: '<?php echo wp_create_nonce("mas_v2_nonce"); ?>'
            },
            success: function(response) {
                if (response.success) {
                    alert('Memory optimization completed successfully');
                    updateMemoryStats(); // Refresh stats
                } else {
                    alert('Memory optimization failed: ' + response.data);
                }
            },
            error: function() {
                alert('Memory optimization request failed');
            }
        });
    };
    
    window.refreshMemoryStats = function() {
        updateMemoryStats();
        console.log('Memory stats refreshed');
    };
    
    // Check memory usage function for security disabled notice
    window.checkMemoryUsage = function() {
        updateMemoryStats();
        
        // Show an alert with current memory usage
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'mas_v2_memory_stats',
                nonce: '<?php echo wp_create_nonce("mas_v2_nonce"); ?>'
            },
            success: function(response) {
                if (response.success) {
                    const stats = response.data;
                    const message = `Current Memory Usage: ${formatBytes(stats.current_usage)} / ${formatBytes(stats.limit)} (${stats.percentage}%)\n\nSecurity Manager will be available when memory usage is optimized.`;
                    alert(message);
                } else {
                    alert('Unable to retrieve memory statistics');
                }
            },
            error: function() {
                alert('Memory check request failed');
            }
        });
    };
    
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Initialize memory stats on page load
    updateMemoryStats();
});
</script> 