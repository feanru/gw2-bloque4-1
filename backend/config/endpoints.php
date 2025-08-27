<?php
require_once __DIR__ . '/../env.php';

$apiBase = getenv('API_BASE_URL') ?: 'https://api.guildwars2.com/v2';
$marketCsv = getenv('MARKET_CSV_URL') ?: 'https://api.datawars2.ie/gw2/v1/items/csv';
$lang = getenv('LANG') ?: 'es';
$apiKey = getenv('GW2_API_KEY') ?: '';

define('API_BASE_URL', $apiBase);
define('MARKET_CSV_URL', $marketCsv);
define('LANG', $lang);
define('GW2_API_KEY', $apiKey);

define('ITEMS_ENDPOINT', API_BASE_URL . '/items');
define('RECIPES_ENDPOINT', API_BASE_URL . '/recipes');
define('RECIPES_SEARCH_ENDPOINT', RECIPES_ENDPOINT . '/search');
?>
