// Run these every time you refactor the routing code:
const testAccountEmail = "test.backend@gmail.com";  // Should be unique each time you run this.
const testAccountValidEmail = "eric.d.mcdonald@gmail.com";
const testAccountPwd = "myValidPwd123!", testAccountNewPwd = "myNewValidPwd123!";
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
        theLoginToken = JSON.parse(this.response).loginToken;
    }
};
xhttp.open("POST", "http://localhost/account/login", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
    email: testAccountEmail,
    password: testAccountPwd
}));

while (theLoginToken == null) {}

// Checking login:
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
        console.log(this.response);
    }
};
xhttp.open("POST", "http://localhost/account/check-login", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
    loginToken: theLoginToken
}));

// Forgot password:
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
	console.log(xhttp.responseText);
    }
};
xhttp.open("POST", "http://localhost/account/forgot-password", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
	email: testAccountValidEmail
}));

// Resetting password:
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
	console.log(xhttp.responseText);
    }
};
xhttp.open("POST", "http://localhost/account/reset-password/38806", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
	newPassword: testAccountNewPwd
}));

// Uploading a file:
var signedUrl = null;
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
        console.log(this.response);
        signedUrl = JSON.parse(this.responseText).signedUrlData;
        console.log(signedUrl);
    }
};
xhttp.open("POST", "http://localhost/file/upload", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
loginToken: theLoginToken,
filePath: "your/file.txt",
fileType: "text/plain"
}));

while (signedUrl == null) {}

xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
        console.log(this.response);
    }
};
xhttp.open("PUT", signedUrl, false);
xhttp.setRequestHeader("Content-Type", "text/plain");  // This header MUST match up with the fileType you provided in the sign URL request.
xhttp.setRequestHeader("x-amz-acl", "public-read");  // You MUST have this header set, otherwise AWS will give you error 403.
xhttp.send("This is the contents of my file!");

// Logging out:
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
        console.log(this.response);
    }
};
xhttp.open("POST", "http://localhost/account/logout", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
    loginToken: theLoginToken
}));

// Checking login token after invalidating it:
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
        console.log(this.response);
    }
};
xhttp.open("POST", "http://localhost/account/check-login", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
    loginToken: theLoginToken
}));