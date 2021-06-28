// Run these every time you refactor the routing code:
const testAccountValidEmail = "eric.d.mcdonald@gmail.com";
const testAccountNewPwd = "myNewValidPwd123!";
var xhttp;

// Hey, don't blame me! Tanner wanted the HTTP statuses to work like this for the Angular side of things.
function statusReturnsResponse(status) {
    return true;
}

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

/*// Resetting password:
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && statusReturnsResponse(this.status)) {
	console.log(xhttp.responseText);
    }
};
xhttp.open("POST", "http://localhost/account/reset-password/92657", false);  // Replace 92657 with the actual sub-link.
xhttp.setRequestHeader("Content-Type", "application/json");
xhttp.send(JSON.stringify({
	newPassword: testAccountNewPwd
}));*/
