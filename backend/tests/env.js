process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fantasy_test';
process.env.JWT_SECRET = 'test-jwt-secret-min-16-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-16-chars';
process.env.FOOTBALL_DATA_KEY = 'test-api-key';
process.env.FOOTBALL_DATA_COMPETITION = 'PL';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.DEFAULT_LEAGUE_ID = '39';
process.env.DEFAULT_SEASON = '2024';
process.env.SEASON_START_DATE = '2024-08-16';
// Tests exercise the football-data.org adapter directly; pin the provider so
// the default ('fpl') doesn't reroute pool/stats calls.
process.env.PLAYER_STATS_PROVIDER = 'football-data';
