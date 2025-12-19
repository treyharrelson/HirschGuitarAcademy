<?php

session_start();
session_unset(); // removes all temporary data
session_destroy();
header("Location: index.php");
exit();

?>