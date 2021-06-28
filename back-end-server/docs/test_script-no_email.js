// Run these every time you refactor the routing code:
const testAccountEmail = "test.backend@gmail.com";  // Should be unique each time you run this.
const testAccountPwd = "MyNewerValidPwd123!", testAccountNewPwd2 = "MyNewerValidPwd123!";
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

// Resetting the password while logged in:
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
        console.log(this.response);
    }
};
xhttp.open("POST", "http://localhost/account/change-password", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
    loginToken: theLoginToken,
    newPassword: testAccountNewPwd2
}));

// Checking the reset password ID:
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
	console.log(xhttp.responseText);
    }
};
xhttp.open("GET", "http://localhost/account/check-password-reset/38806", false);
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send();

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
filePath: "yourother/file.txt",
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

// Listing files:
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
    dirPath: "your\\other2"
}));

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
    maxFiles: 1000
}));

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
