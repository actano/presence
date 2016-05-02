if (parent.frames.length > 0) {
    document.body.classList.add('framed');
}
var dateInput = document.getElementById('dateinput');
dateInput.onchange = function(){
    document.forms[0].submit();
};