<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "--- Creating Course Resources Table & Seeding Data ---\n";

    // 1. Create course_resources table
    $query = "CREATE TABLE IF NOT EXISTS `course_resources` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `course_id` INT DEFAULT NULL,
        `batch_id` INT DEFAULT NULL,
        `title` VARCHAR(255) NOT NULL,
        `category` ENUM('handout', 'asset_pack', 'software_tool', 'reference_guide', 'other') DEFAULT 'handout',
        `file_type` VARCHAR(50) DEFAULT 'PDF',
        `file_size` VARCHAR(50) DEFAULT NULL,
        `download_url` TEXT NOT NULL,
        `description` TEXT DEFAULT NULL,
        `is_external_link` TINYINT(1) DEFAULT 0,
        `order_index` INT DEFAULT 0,
        `status` ENUM('active', 'inactive') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (`course_id`),
        INDEX (`batch_id`),
        INDEX (`category`),
        INDEX (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $db->exec($query);
    echo "✓ Table 'course_resources' created or verified.\n";

    // 2. Check if records already exist
    $count = $db->query("SELECT COUNT(*) FROM `course_resources`")->fetchColumn();
    if ($count == 0) {
        // Find course IDs
        $gdId = $db->query("SELECT id FROM courses WHERE course_code = 'GD-101' OR title LIKE '%Graphic%' LIMIT 1")->fetchColumn() ?: 1;
        $wdId = $db->query("SELECT id FROM courses WHERE course_code = 'WD-201' OR title LIKE '%Web%' LIMIT 1")->fetchColumn() ?: 2;
        $dmId = $db->query("SELECT id FROM courses WHERE course_code = 'DM-301' OR title LIKE '%Marketing%' LIMIT 1")->fetchColumn() ?: 3;

        $ins = $db->prepare("
            INSERT INTO `course_resources` 
            (`course_id`, `batch_id`, `title`, `category`, `file_type`, `file_size`, `download_url`, `description`, `is_external_link`, `order_index`, `status`) 
            VALUES 
            (:cid, NULL, :title, :cat, :ftype, :fsize, :url, :desc, :is_ext, :ord, 'active')
        ");

        $seedData = [
            // Graphic Design (GD-101)
            [ 'cid' => $gdId, 'title' => 'Photoshop Actions, Mockups & Brush Master Bundle', 'cat' => 'asset_pack', 'ftype' => 'PSD & ABR Pack', 'fsize' => '48.5 MB', 'url' => 'https://creativecomputeracademy.com/downloads/gd-photoshop-bundle.zip', 'desc' => 'High quality studio mockups, retouching actions, and custom brushes.', 'is_ext' => 0, 'ord' => 1 ],
            [ 'cid' => $gdId, 'title' => 'Adobe Illustrator Vector Assets & Logo Grid Templates', 'cat' => 'asset_pack', 'ftype' => 'AI & EPS Bundle', 'fsize' => '32.1 MB', 'url' => 'https://creativecomputeracademy.com/downloads/gd-illustrator-grids.zip', 'desc' => 'Golden ratio grids, logo construction guides, and vector icon sets.', 'is_ext' => 0, 'ord' => 2 ],
            [ 'cid' => $gdId, 'title' => 'Typography & Curated Font Harmonies Cheatsheet', 'cat' => 'handout', 'ftype' => 'PDF Reference', 'fsize' => '4.8 MB', 'url' => 'https://creativecomputeracademy.com/downloads/gd-typography-guide.pdf', 'desc' => 'Font pairing rules, kerning tips, and commercial font licenses list.', 'is_ext' => 0, 'ord' => 3 ],
            [ 'cid' => $gdId, 'title' => 'Print Media CMYK & Packaging Bleed Standard Guide', 'cat' => 'reference_guide', 'ftype' => 'PDF Manual', 'fsize' => '6.2 MB', 'url' => 'https://creativecomputeracademy.com/downloads/gd-cmyk-print-manual.pdf', 'desc' => 'Industry printing standards, bleed margins, and die-cut guidelines.', 'is_ext' => 0, 'ord' => 4 ],
            [ 'cid' => $gdId, 'title' => 'Adobe Creative Cloud', 'cat' => 'software_tool', 'ftype' => 'Tool', 'fsize' => 'Cloud Suite', 'url' => 'https://www.adobe.com/creativecloud.html', 'desc' => 'Industry benchmark suite for Photoshop, Illustrator & InDesign.', 'is_ext' => 1, 'ord' => 5 ],
            [ 'cid' => $gdId, 'title' => 'Figma UI & Graphic Design', 'cat' => 'software_tool', 'ftype' => 'Web App', 'fsize' => 'Free Tool', 'url' => 'https://www.figma.com/', 'desc' => 'Modern collaborative tool for digital graphic & UI mockup design.', 'is_ext' => 1, 'ord' => 6 ],
            [ 'cid' => $gdId, 'title' => 'Coolors Color Palette Generator', 'cat' => 'software_tool', 'ftype' => 'Web Tool', 'fsize' => 'Online', 'url' => 'https://coolors.co/', 'desc' => 'Generate harmonious color palettes and export HEX/RGB codes.', 'is_ext' => 1, 'ord' => 7 ],

            // Web Development (WD-201)
            [ 'cid' => $wdId, 'title' => 'HTML5 & CSS3 Master Reference Guide (Flexbox & Grid)', 'cat' => 'handout', 'ftype' => 'PDF Handbook', 'fsize' => '8.5 MB', 'url' => 'https://creativecomputeracademy.com/downloads/wd-html5-css3-guide.pdf', 'desc' => 'Comprehensive HTML5 semantic tags and modern CSS layout cheatsheets.', 'is_ext' => 0, 'ord' => 1 ],
            [ 'cid' => $wdId, 'title' => 'Modern JavaScript (ES6+) Complete Syntax & Async Handbook', 'cat' => 'handout', 'ftype' => 'PDF Cheatsheet', 'fsize' => '6.4 MB', 'url' => 'https://creativecomputeracademy.com/downloads/wd-js-es6-handbook.pdf', 'desc' => 'ES6 modules, Promises, Async/Await, Array methods, and DOM APIs.', 'is_ext' => 0, 'ord' => 2 ],
            [ 'cid' => $wdId, 'title' => 'React.js State Architecture & Custom Hooks Starter', 'cat' => 'asset_pack', 'ftype' => 'ZIP Starter', 'fsize' => '15.6 MB', 'url' => 'https://creativecomputeracademy.com/downloads/wd-react-starter-kit.zip', 'desc' => 'Clean component architecture with React Router and Tailwind CSS preconfigured.', 'is_ext' => 0, 'ord' => 3 ],
            [ 'cid' => $wdId, 'title' => 'PHP & MySQL PDO REST API Authentication Template', 'cat' => 'asset_pack', 'ftype' => 'ZIP Backend', 'fsize' => '9.8 MB', 'url' => 'https://creativecomputeracademy.com/downloads/wd-php-rest-api-template.zip', 'desc' => 'Token authentication, CORS setup, and PDO prepared statement CRUD boilerplates.', 'is_ext' => 0, 'ord' => 4 ],
            [ 'cid' => $wdId, 'title' => 'VS Code Editor', 'cat' => 'software_tool', 'ftype' => 'Software', 'fsize' => 'Installer', 'url' => 'https://code.visualstudio.com/', 'desc' => 'Industry standard code editor with live server & extensions.', 'is_ext' => 1, 'ord' => 5 ],
            [ 'cid' => $wdId, 'title' => 'Git & GitHub Desktop', 'cat' => 'software_tool', 'ftype' => 'Tool', 'fsize' => 'Desktop App', 'url' => 'https://desktop.github.com/', 'desc' => 'Version control software for team collaboration and deployments.', 'is_ext' => 1, 'ord' => 6 ],
            [ 'cid' => $wdId, 'title' => 'Postman API Client', 'cat' => 'software_tool', 'ftype' => 'Tool', 'fsize' => 'Client App', 'url' => 'https://www.postman.com/', 'desc' => 'Test REST API endpoints, headers, authentication and JSON payloads.', 'is_ext' => 1, 'ord' => 7 ],

            // Digital Marketing (DM-301)
            [ 'cid' => $dmId, 'title' => 'Complete On-Page & Technical SEO Audit Sheet', 'cat' => 'handout', 'ftype' => 'XLSX Sheet', 'fsize' => '3.4 MB', 'url' => 'https://creativecomputeracademy.com/downloads/dm-seo-audit-checklist.xlsx', 'desc' => 'Step-by-step checklist to audit website ranking factors and crawl errors.', 'is_ext' => 0, 'ord' => 1 ],
            [ 'cid' => $dmId, 'title' => 'Meta (Facebook & Instagram) High-ROAS Ad Copy Frameworks', 'cat' => 'handout', 'ftype' => 'PDF Playbook', 'fsize' => '7.8 MB', 'url' => 'https://creativecomputeracademy.com/downloads/dm-meta-ads-copywriting.pdf', 'desc' => 'Hook templates, headline formulas, and video script angles for Meta Ads.', 'is_ext' => 0, 'ord' => 2 ],
            [ 'cid' => $dmId, 'title' => 'Google Ads PPC Keyword Research & Bidding Blueprint', 'cat' => 'reference_guide', 'ftype' => 'PDF Guide', 'fsize' => '6.1 MB', 'url' => 'https://creativecomputeracademy.com/downloads/dm-google-ads-blueprint.pdf', 'desc' => 'Negative keyword lists, match types, Quality Score optimizations, and bidding strategies.', 'is_ext' => 0, 'ord' => 3 ],
            [ 'cid' => $dmId, 'title' => 'Meta Ads Manager', 'cat' => 'software_tool', 'ftype' => 'Platform', 'fsize' => 'Meta Cloud', 'url' => 'https://business.facebook.com/', 'desc' => 'Run, optimize and track Facebook & Instagram ad campaigns.', 'is_ext' => 1, 'ord' => 4 ],
            [ 'cid' => $dmId, 'title' => 'Google Analytics 4 (GA4)', 'cat' => 'software_tool', 'ftype' => 'Analytics', 'fsize' => 'Google Cloud', 'url' => 'https://analytics.google.com/', 'desc' => 'Track website visitor conversions, user events, and retention.', 'is_ext' => 1, 'ord' => 5 ]
        ];

        foreach ($seedData as $row) {
            $ins->execute([
                ':cid' => $row['cid'],
                ':title' => $row['title'],
                ':cat' => $row['cat'],
                ':ftype' => $row['ftype'],
                ':fsize' => $row['fsize'],
                ':url' => $row['url'],
                ':desc' => $row['desc'],
                ':is_ext' => $row['is_ext'],
                ':ord' => $row['ord']
            ]);
        }
        echo "✓ Seeded " . count($seedData) . " initial course resources.\n";
    }

    echo "--- Course Resources Setup Completed! ---\n";
} catch (PDOException $e) {
    echo "Setup failed: " . $e->getMessage() . "\n";
}
?>
