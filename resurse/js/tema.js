if (localStorage.getItem("tema")){
    document.body.classList.add("dark");
}

else
{
    document.body.classList.remove("dark");
}

/*document.addEventListener("DOMContentLoaded", function() {
    const iconTema = document.getElementById("icon-tema");
    const temaCurenta = localStorage.getItem("tema");

     if(temaCurenta==="sepia"){
        document.body.classList.add("sepia");
        document.body.classList.remove("dark");
        iconTema.classList.add("fa-sun", "fa-moon");
    }
    else if (temaCurenta === "dark") {
        document.body.classList.add("dark");
        document.body.classList.remove("sepia");
        iconTema.classList.remove("fa-moon");
        iconTema.classList.add("fa-sun");
    } 
    
    else {
        document.body.classList.remove("dark");
        document.body.classList.remove("sepia");
        iconTema.classList.add("fa-moon");
    }
});


window.addEventListener("DOMContentLoaded", function(){
    const iconTema = document.getElementById("icon-tema");
    document.getElementById("schimba_tema").onclick = function(){
        if(document.body.classList.contains("sepia") && document.body.classList.contains("dark")){
            document.body.classList.remove("sepia");
            document.body.classList.remove("dark");
            iconTema.classList.remove("fa-sun");
            iconTema.classList.add("fa-moon");
            localStorage.removeItem("tema");
        }
        else if(document.body.classList.contains("sepia")){
            document.body.classList.remove("sepia");
            document.body.classList.add("dark");
            iconTema.classList.remove("fa-moon");
            iconTema.classList.add("fa-sun");
            localStorage.setItem("tema", "dark");
            
        }
        else if(document.body.classList.contains("dark")){
            iconTema.classList.remove("fa-sun");
            iconTema.classList.add("fa-moon");

            document.body.classList.remove("dark");
            localStorage.removeItem("tema")
        }
        
        else
        {
            iconTema.classList.remove("fa-moon");
            iconTema.classList.add("fa-sun");
            document.body.classList.add("dark");
            localStorage.setItem("tema", "dark")
        }
    }
    document.getElementById("theme-sepia").onclick = function(){
        var themeSepia = document.getElementsByName("theme");
        document.body.classList.add("sepia");
        localStorage.setItem("tema", "sepia");
    }
});*/

if (localStorage.getItem('bsTheme')){
    document.body.classList.add("dark");
}

else
{
    document.body.classList.remove("dark");
}


document.addEventListener('DOMContentLoaded', (event) => {
    const htmlElement = document.documentElement;
    const switchElement = document.getElementById('darkModeSwitch');
    const iconTema = document.getElementById("icon-tema");
    const butonSepia = document.getElementById('theme-sepia');

    // Set the default theme to dark if no setting is found in local storage
    const currentTheme = localStorage.getItem('bsTheme');
    document.body.classList.add(currentTheme);
    switchElement.checked = currentTheme === 'dark';

    if(currentTheme === 'dark')
    {
        iconTema.classList.remove("fa-moon");
        iconTema.classList.add("fa-sun");
        butonSepia.checked = false;
    }
    else if(currentTheme === 'sepia')
    {
        document.body.classList.add("sepia");
        localStorage.setItem("bsTheme", "sepia");
        butonSepia.checked = true;
    }
    else
    {
        iconTema.classList.remove("fa-sun");
        iconTema.classList.add("fa-moon");
        butonSepia.checked = false;
    }

    switchElement.addEventListener('change', function () {
        if (this.checked) {
           /* htmlElement.setAttribute('data-bs-theme', 'dark');*/
            document.body.classList.add("dark");
            document.body.classList.remove("sepia");
            localStorage.setItem('bsTheme', 'dark');
            iconTema.classList.remove("fa-moon");
            iconTema.classList.add("fa-sun");
            butonSepia.checked = false;
        } else {
           /* htmlElement.setAttribute('data-bs-theme', 'light');*/
            document.body.classList.remove("dark");
            document.body.classList.remove("sepia");
            localStorage.removeItem('bsTheme', 'dark');
            iconTema.classList.remove("fa-sun");
            iconTema.classList.add("fa-moon");
            butonSepia.checked = false;
        }
    });

    document.getElementById("theme-sepia").onclick = function(){
        document.body.classList.add("sepia");
        localStorage.setItem("bsTheme", "sepia");
        butonSepia.checked = true;
    }
});