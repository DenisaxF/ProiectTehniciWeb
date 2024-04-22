window.addEventListener("load", function(){

    /*console.log(document.getElementById("produse").innerHTML)*/
    /*document.getElementById("filtrare").addEventListener("click", function(){})*/

    document.getElementById("inp-pret").onchange = function(){
        document.getElementById("infoRange").innerHTML=`(${this.value})`
    }

    document.getElementById("filtrare").onclick = function(){
        var inpNume = document.getElementById("inp-nume").value.trim().toLowerCase()

        var vRadio = document.getElementsByName("gr_rad")
        let inpCalorii;
        for (let r of vRadio){
            if(r.checked){
                inpCalorii = r.value;
                break
            }
        }
        let minCalorii, maxCalorii
        if(inpCalorii!= "toate"){
            let aux = inpCalorii.split(":")
            minCalorii = parseInt(aux[0])
            maxCalorii = parseInt(aux[1])
        }

        var inpPret = parseInt(document.getElementById("inp-pret").value)

        var inpCateg = document.getElementById("inp-categorie").value.trim().toLowerCase()

        var produse = document.getElementsByClassName("produs")

        for (let produs of produse){
            let valNume = produs.getElementsByClassName("val-nume")[0].innerHTML
            let cond1 = valNume.startsWith(inpNume)

            let valCalorii = parseInt(produs.getElementsByClassName("val-calorii")[0].innerHTML)
            let cond2=(inpCalorii == "toate" || (minCalorii<=valCalorii && valCalorii <maxCalorii))

            let valPret = parseFloat(produs.getElementsByClassName("val-pret")[0].innerHTML)
            let cond3 = inpPret < valPret;

            let valCateg = produs.getElementsByClassName("val-categorie")[0].innerHTML
            let cond4 = (inpCateg == "toate" || inpCateg == valCateg)

            if(cond1 && cond2&& cond3 && cond4) {
                produs.style.display="block";
            }

            else
            {
                produs.style.display="none";
            }
        }
    } 
})

