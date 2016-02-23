<?php

// make sure request is not blocked by browser policy
header('Access-Control-Allow-Origin: *');

if (isset($_POST['request']) && $_POST['request'] == 'save_titles') {

    $titles = json_decode($_POST['titles'], true);
    foreach($titles as $title) {
        db()->sql('insert into titles set title=?', [ $title ]);
    }

    echo json_encode([
        'success' => true
    ]);

    exit;
}

