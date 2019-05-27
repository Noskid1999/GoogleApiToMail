

function reveal(username,useremail){
    // console.log(element);
    document.getElementById('receiverName').value=username;
    document.getElementById('receiverEmail').value=useremail;
    document.getElementById('formWrapper').classList.add('showForm');
}
function sendMultiple(){
    var multipleEmail=document.getElementsByName('multiple');
    var checkedEmail=[];
    multipleEmail.forEach(function(email){
        if(email.checked)
            checkedEmail.push(email.value);
    });
    document.getElementById('receiverName').value='Multiple';
    document.getElementById('receiverEmail').value=checkedEmail;
    document.getElementById('formWrapper').classList.add('showForm');
}
document.getElementById("cancelButton").onclick = function () {
    document.getElementById('formWrapper').classList.remove('showForm');
}
