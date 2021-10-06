<?php
echo "welcome to php";
if(isset($_POST['sendRes'])){
   echo"se detecto el evento";
   $name = $_POST['name'];
   echo "el nombre es ".$name;
}

?>