// Run these every time you refactor the routing code:
const testAccountEmail = "tmoss404@gmail.com";  // Should be unique each time you run this.
const testAccountPwd = "changed1@", testAccountNewPwd2 = "myValidPwd123!";
var xhttp;

// Hey, don't blame me! Tanner wanted the HTTP statuses to work like this for the Angular side of things.
function statusReturnsResponse(status) {
    return true;
}

// Registering:
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
        console.log(this.response);
    }
};
xhttp.open("POST", "http://localhost/account/register", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
    email: testAccountEmail,
    password: testAccountPwd
}));

// Logging in:

var theLoginToken = null;
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
        console.log(this.response);
        var responseJson = JSON.parse(this.response);
        if (responseJson.loginToken) {
            theLoginToken = responseJson.loginToken;
        }
    }
};
xhttp.open("POST", "http://localhost/account/login", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
    email: testAccountEmail,
    password: testAccountPwd
}));

while (theLoginToken == null) {}


// Listing files (no directory path):
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
        console.log(this.response);
    }
};
xhttp.open("POST", "http://localhost/file/list", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
    loginToken: theLoginToken,
    maxFiles: 1000,
    showNestedFiles: false,
    dirPath: "test0"
}));
