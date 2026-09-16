<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "--- Starting Course Modules Seeding ---\n";

    // Ensure courses exist
    $courses = [
        [
            'code' => 'GD-101',
            'title' => 'Graphic Design & Multimedia',
            'category' => 'Creative & Design',
            'duration' => 3,
            'classes' => 36,
            'desc' => 'Master Adobe Photoshop, Illustrator, InDesign, vector branding, and AI creative tools.',
            'modules' => [
                [
                    'no' => 1,
                    'title' => 'Design Principles, Color Theory & Typography',
                    'desc' => 'Core visual hierarchy, color harmonies, font pairing, rule of thirds, and modern aesthetic fundamentals.',
                    'classes' => 6
                ],
                [
                    'no' => 2,
                    'title' => 'Adobe Photoshop Mastery & Photo Manipulation',
                    'desc' => 'Advanced photo retouching, background removal, layer masks, lighting adjustment, and surreal manipulation.',
                    'classes' => 6
                ],
                [
                    'no' => 3,
                    'title' => 'Vector Illustration & Logo Design with Illustrator',
                    'desc' => 'Pen tool mastery, vector icons, custom mascot logos, typography branding, and vector illustration.',
                    'classes' => 6
                ],
                [
                    'no' => 4,
                    'title' => 'Social Media Branding & Advertising Graphics',
                    'desc' => 'High-converting Facebook/Instagram ad creative, YouTube thumbnails, banner carousels, and visual storytelling.',
                    'classes' => 6
                ],
                [
                    'no' => 5,
                    'title' => 'Print Media, Brochure & Packaging Design',
                    'desc' => 'Corporate identity kits, trifold brochures, product packaging, bleed margins, and print-ready CMYK preparation.',
                    'classes' => 6
                ],
                [
                    'no' => 6,
                    'title' => 'Portfolio Showcase & Freelance Marketplace Launch',
                    'desc' => 'Building Behance & Dribbble case studies, mockups presentation, Fiverr/Upwork gig ranking, and client communication.',
                    'classes' => 6
                ]
            ]
        ],
        [
            'code' => 'WD-201',
            'title' => 'Full Stack Web Development',
            'category' => 'Programming',
            'duration' => 6,
            'classes' => 72,
            'desc' => 'Comprehensive web development covering HTML5, CSS3, Tailwind, JavaScript ES6+, React.js, PHP, MySQL, and REST APIs.',
            'modules' => [
                [
                    'no' => 1,
                    'title' => 'HTML5, Semantic Web & Advanced CSS Layouts',
                    'desc' => 'HTML5 semantic tags, CSS Flexbox, CSS Grid, media queries, CSS variables, and modern web responsiveness.',
                    'classes' => 10
                ],
                [
                    'no' => 2,
                    'title' => 'Modern Tailwind CSS & UI Component Architecture',
                    'desc' => 'Rapid prototyping with Tailwind CSS, dark mode design systems, responsive navbar, modals, and animations.',
                    'classes' => 10
                ],
                [
                    'no' => 3,
                    'title' => 'Core & Modern JavaScript (ES6+ Deep Dive)',
                    'desc' => 'Data structures, DOM manipulation, events, async/await, Fetch API, array methods, and OOP concepts in JS.',
                    'classes' => 12
                ],
                [
                    'no' => 4,
                    'title' => 'React.js Frontend Architecture & State Management',
                    'desc' => 'React Components, Props, Hooks (useState, useEffect, useContext), React Router, and Axios integration.',
                    'classes' => 14
                ],
                [
                    'no' => 5,
                    'title' => 'Backend API Development with PHP & MySQL',
                    'desc' => 'Relational database schema design, PDO prepared statements, JWT/Session authentication, and RESTful API endpoints.',
                    'classes' => 14
                ],
                [
                    'no' => 6,
                    'title' => 'Full Stack Capstone Project & Live Cloud Deployment',
                    'desc' => 'Building an end-to-end web application with Git/GitHub, cPanel/Vercel hosting, security hardening, and performance optimization.',
                    'classes' => 12
                ]
            ]
        ],
        [
            'code' => 'DM-301',
            'title' => 'Advanced Digital Marketing',
            'category' => 'Marketing & Business',
            'duration' => 3,
            'classes' => 36,
            'desc' => 'Search Engine Optimization (SEO), Meta Ads Manager, Google PPC, Content Strategy, and Analytics.',
            'modules' => [
                [
                    'no' => 1,
                    'title' => 'Digital Marketing Fundamentals & Funnel Strategy',
                    'desc' => 'Customer persona development, marketing funnels (AIDA), competitor research, and digital branding blueprint.',
                    'classes' => 6
                ],
                [
                    'no' => 2,
                    'title' => 'Search Engine Optimization (On-Page, Off-Page & Technical SEO)',
                    'desc' => 'Keyword research with Ahrefs/SEMrush, SEO copywriting, internal linking, backlink building, and Google Search Console.',
                    'classes' => 6
                ],
                [
                    'no' => 3,
                    'title' => 'Meta Advertising (Facebook & Instagram Ads Mastery)',
                    'desc' => 'Meta Ads Manager, custom & lookalike audiences, Pixel setup, CBO campaigns, A/B testing, and ROAS optimization.',
                    'classes' => 6
                ],
                [
                    'no' => 4,
                    'title' => 'Google Ads & Search Engine Marketing (PPC)',
                    'desc' => 'Search ads, Display network, YouTube video ads, quality score optimization, conversion tracking, and bidding strategies.',
                    'classes' => 6
                ],
                [
                    'no' => 5,
                    'title' => 'Content Marketing, Copywriting & Email Automation',
                    'desc' => 'High-converting sales copy, lead magnet design, automated email flows with Mailchimp, and CRM management.',
                    'classes' => 6
                ],
                [
                    'no' => 6,
                    'title' => 'Google Analytics 4, Tag Manager & Agency Client Acquisition',
                    'desc' => 'GA4 event tracking, GTM setup, client reporting dashboards, freelance proposals, and digital agency workflows.',
                    'classes' => 6
                ]
            ]
        ]
    ];

    foreach ($courses as $cData) {
        // 1. Find or insert course
        $chkCourse = $db->prepare("SELECT id FROM courses WHERE course_code = :code OR title = :title LIMIT 1");
        $chkCourse->execute([':code' => $cData['code'], ':title' => $cData['title']]);
        $existingCourse = $chkCourse->fetch(PDO::FETCH_ASSOC);

        if ($existingCourse) {
            $courseId = intval($existingCourse['id']);
            echo "✓ Found existing course: {$cData['title']} (ID: {$courseId})\n";
        } else {
            $insCourse = $db->prepare("
                INSERT INTO courses (course_code, title, category, duration_months, total_classes, description, status)
                VALUES (:code, :title, :category, :duration, :classes, :desc, 'active')
            ");
            $insCourse->execute([
                ':code' => $cData['code'],
                ':title' => $cData['title'],
                ':category' => $cData['category'],
                ':duration' => $cData['duration'],
                ':classes' => $cData['classes'],
                ':desc' => $cData['desc']
            ]);
            $courseId = intval($db->lastInsertId());
            echo "✓ Created course: {$cData['title']} (ID: {$courseId})\n";
        }

        // 2. Seed / Update Modules for this course
        foreach ($cData['modules'] as $mod) {
            $chkMod = $db->prepare("SELECT id FROM course_modules WHERE course_id = :cid AND module_no = :mno LIMIT 1");
            $chkMod->execute([':cid' => $courseId, ':mno' => $mod['no']]);
            $existingMod = $chkMod->fetch(PDO::FETCH_ASSOC);

            if ($existingMod) {
                $upMod = $db->prepare("
                    UPDATE course_modules 
                    SET title = :title, description = :desc, duration_classes = :dur, order_index = :ord, status = 'active'
                    WHERE id = :id
                ");
                $upMod->execute([
                    ':title' => $mod['title'],
                    ':desc' => $mod['desc'],
                    ':dur' => $mod['classes'],
                    ':ord' => $mod['no'],
                    ':id' => $existingMod['id']
                ]);
            } else {
                $insMod = $db->prepare("
                    INSERT INTO course_modules (course_id, module_no, title, description, duration_classes, order_index, status)
                    VALUES (:cid, :mno, :title, :desc, :dur, :ord, 'active')
                ");
                $insMod->execute([
                    ':cid' => $courseId,
                    ':mno' => $mod['no'],
                    ':title' => $mod['title'],
                    ':desc' => $mod['desc'],
                    ':dur' => $mod['classes'],
                    ':ord' => $mod['no']
                ]);
            }
        }
        echo "  → Seeded " . count($cData['modules']) . " modules for {$cData['title']}.\n";
    }

    echo "--- All Course Modules Seeded Successfully! ---\n";
} catch (PDOException $e) {
    echo "Error seeding modules: " . $e->getMessage() . "\n";
}
?>
