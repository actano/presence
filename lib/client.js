require('../styles/styles.styl');

function init() {
    var dateInput = document.getElementById('dateinput');
    dateInput.onchange = function(){
        document.forms[0].submit();
    };    
}
