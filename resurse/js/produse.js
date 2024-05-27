/*const { text } = require("express")*/

window.addEventListener("load", function(){

    /*console.log(document.getElementById("produse").innerHTML)*/
    /*document.getElementById("filtrare").addEventListener("click", function(){})*/

    document.getElementById("inp-pret").onchange = function(){
        document.getElementById("infoRange").innerHTML=`(${this.value})`
    }

    document.getElementById("filtrare").addEventListener("click", function(){ })
    document.getElementById("filtrare").onclick = function(){
        var inpNume = document.getElementById("inp-nume").value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        /*NFD normalizeaza textul, separand caracterele compuse in caractere de baza si semnlee dicatritice. /[\u0300-\u036f] inlcouieste diactricile cu siruri goale si /g aplikca schimbarea peste tot*/

        var vRadio = document.getElementsByName("gr_rad")
        let inpCalorii;
        for (let r of vRadio){
            if(r.checked){
                inpCalorii = r.value;
                break;
            }
        }
        let minCalorii, maxCalorii
        if(inpCalorii!= "toate"){
            aux = inpCalorii.split(":")
            minCalorii = parseInt(aux[0])
            maxCalorii = parseInt(aux[1])
        }

        var inpPret = parseInt(document.getElementById("inp-pret").value)

        var inpCateg = document.getElementById("inp-categorie").value.trim().toLowerCase()

        var produse = document.getElementsByClassName("produs")
        let noProductsMessage = document.getElementById("no-products-message");
        const productCountElement = document.getElementById("count");
        /*const textarea = document.getElementById("inp-nume");*/
        let productsVisible = false;
        let visibleCount = 0;

        for (let produs of produse){
            let valNume = produs.getElementsByClassName("val-nume")[0].innerHTML.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            let cond1 = valNume.startsWith(inpNume)

            let valCalorii = parseInt(produs.getElementsByClassName("val-calorii")[0].innerHTML)
            let cond2=(inpCalorii == "toate" || (minCalorii<=valCalorii && valCalorii <maxCalorii))

            let valPret = parseFloat(produs.getElementsByClassName("val-pret")[0].innerHTML)
            let cond3 = inpPret < valPret;

            let valCateg = produs.getElementsByClassName("val-categorie")[0].innerHTML
            let cond4 = (inpCateg == "toate" || inpCateg == valCateg)

            if(cond1 && cond2&& cond3 && cond4) {
                produs.style.display="block";
                productsVisible = true;
                visibleCount++;
                
            }

            else
            {
                produs.style.display="none";
                /*if (!cond1) {
                    textarea.classList.add("is-invalid");
                } else {
                    textarea.classList.remove("is-invalid");
                }*/
            }

        }

        if (!productsVisible) {
            noProductsMessage.style.display = "block";
        } else {
            noProductsMessage.style.display = "none";
        }

        productCountElement.textContent = visibleCount;

        function removeDiacritics(text) {
            return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
    } 
    document.getElementById("resetare").onclick= function(){

        let noProductsMessage = document.getElementById("no-products-message");
                
        document.getElementById("inp-nume").value="";
        
        document.getElementById("inp-pret").value=document.getElementById("inp-pret").min;
        document.getElementById("inp-categorie").value="toate";
        document.getElementById("i_rad4").checked=true;
        var produse=document.getElementsByClassName("produs");
        document.getElementById("infoRange").innerHTML="(0)";
        document.getElementById("count").textContent = 0;
        for (let prod of produse){
            prod.style.display="block";
            noProductsMessage.style.display = "none"
        }
    }

    function sorteaza (semn){
        var produse = document.getElementsByClassName("produs");
        var v_produse = Array.from(produse);
        v_produse.sort(function(a,b){
            let pret_a = parseInt(a.getElementsByClassName("val-pret")[0].innerHTML)
            let pret_b = parseInt(b.getElementsByClassName("val-pret")[0].innerHTML)
            if(pret_a == pret_b){
                let nume_a = a.getElementsByClassName("val-nume")[0].innerHTML
                let nume_b = b.getElementsByClassName("val-nume")[0].innerHTML
                return semn*nume_a.localeCompare(nume_b);
            }
            return semn*(pret_a-pret_b);
        })
        console.log(v_produse)
        for (let prod of v_produse){
            prod.parentNode.appendChild(prod)
        }
    }

    document.getElementById("sortCrescNume").onclick= function(){
        sorteaza(1)
    }

    document.getElementById("sortDescrescNume").onclick= function(){
        sorteaza(-1)
    }

    window.onkeydown=function(e){
        if (e.key=="c" && e.altKey){
            var suma=0;
            var produse=document.getElementsByClassName("produs");
            for (let produs of produse){
                var stil=getComputedStyle(produs)
                if (stil.display!="none"){
                    suma+=parseFloat(produs.getElementsByClassName("val-pret")[0].innerHTML)
                }
            }
            if (!document.getElementById("par_suma")){
                let p= document.createElement("p")
                p.innerHTML=suma;
                p.id="par_suma";
                container=document.getElementById("produse")
                container.insertBefore(p,container.children[0])
                setTimeout(function(){
                    var pgf=document.getElementById("par_suma")
                    if(pgf)
                        pgf.remove()
                }, 2000)
            }

        }
    }
})



