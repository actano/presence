import css from './views/styles.styl'

function init() {
    assert(css != null);
    var dateInput = document.getElementById('dateinput');
    dateInput.onchange = function(){
        document.forms[0].submit();
    };    
}

init();