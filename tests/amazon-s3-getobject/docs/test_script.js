var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
        console.log(this.response);
    }
};
xhttp.open("POST", "http://localhost/file/get-object", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({buffer: "THIS OBJECT DOESNT EXIST"}));