<?php
// Utility to compute nested recipe trees for Guild Wars 2 items.
// Stores and retrieves results from Redis to avoid recomputation.

require_once __DIR__ . '/redis_cache.php';

/**
 * Fetches JSON from the given URL with basic Redis caching.
 */
function fetch_json_cached(string $url, string $cacheKey, int $ttl = 3600): ?array {
    $cache = redis_get($cacheKey);
    if ($cache && isset($cache['data'])) {
        $json = json_decode($cache['data'], true);
        if ($json !== null) {
            return $json;
        }
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 200 && $body !== false) {
        redis_set($cacheKey, $body, $ttl);
        $json = json_decode($body, true);
        if ($json !== null) {
            return $json;
        }
    }
    return null;
}

/**
 * Recursively builds the nested recipe tree for an item.
 * Returns null if no recipe is found.
 */
function build_recipe_tree(int $itemId, array &$visited = []): ?array {
    if (isset($visited[$itemId])) {
        return null; // prevent infinite loops
    }
    $visited[$itemId] = true;

    $search = fetch_json_cached(
        "https://api.guildwars2.com/v2/recipes/search?output={$itemId}",
        "recipe_search_{$itemId}",
        3600
    );
    if (!$search || count($search) === 0) {
        return null;
    }
    $recipeId = $search[0];
    $recipe = fetch_json_cached(
        "https://api.guildwars2.com/v2/recipes/{$recipeId}?lang=es",
        "recipe_{$itemId}",
        3600
    );
    if (!$recipe || !isset($recipe['ingredients'])) {
        return null;
    }

    $node = [
        'output_item_count' => $recipe['output_item_count'] ?? 1,
        'ingredients' => []
    ];

    foreach ($recipe['ingredients'] as $ing) {
        $child = [
            'item_id' => $ing['item_id'],
            'count' => $ing['count']
        ];
        $sub = build_recipe_tree((int)$ing['item_id'], $visited);
        if ($sub) {
            $child['recipe'] = $sub;
        }
        $node['ingredients'][] = $child;
    }

    return $node;
}

/**
 * Public helper to obtain nested recipe tree for an item.
 * Utilizes Redis to persist the computed tree.
 */
function get_nested_recipe(int $itemId): ?array {
    $cache = redis_get("nested_recipe_{$itemId}");
    if ($cache && isset($cache['data'])) {
        $json = json_decode($cache['data'], true);
        if ($json !== null) {
            return $json;
        }
    }

    $visited = [];
    $tree = build_recipe_tree($itemId, $visited);
    if ($tree !== null) {
        redis_set("nested_recipe_{$itemId}", json_encode($tree), 86400);
    }
    return $tree;
}

if (php_sapi_name() === 'cli' && isset($argv[1])) {
    $itemId = intval($argv[1]);
    $tree = get_nested_recipe($itemId);
    echo json_encode($tree, JSON_PRETTY_PRINT) . "\n";
}
