const express = require("express");
const cron = require('node-cron');
const fs= require('fs');
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
const ejs=require('ejs');
const AccesBD= require("./module_proprii/accesbd.js");

const formidable=require("formidable");
const {Utilizator}=require("./module_proprii/utilizator.js")
const session=require('express-session');
const Drepturi = require("./module_proprii/drepturi.js");
const { genereazaToken } = require("./module_proprii/parole.js");

x = require('pg');
const Client = x.Client;

var client= new Client({database:"cti_2024",
        user:"denisa",
        password:"denisa",
        host:"localhost",
        port:5432});
client.connect();

client.query("select * from unnest(enum_range(null::gen_carti))", function(err, rez){
    console.log(rez);
})

obGlobal = {
    obErori:null,
    obImagini:null,
    folderCss: path.join(__dirname, "resurse/css"),
    folderScss: path.join(__dirname, "resurse/scss"),
    folderBackup: path.join(__dirname, "backup"),
}

const ofertePath = path.join(__dirname, "resurse/json/oferte.json")

client.query("select * from unnest(enum_range(null::gen_carti))", function(err, rezCategorie){
    if (err){
        console.log(err);
    }
    else{
        obGlobal.optiuniMeniu=rezCategorie.rows;
    }
});

vect_foldere=["temp", "temp1", "backup"]
for(let folder of vect_foldere){
    let caleFolder = path.join(__dirname, folder)
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder)
    }
}


app= express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.use(session({ // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
  }));

app.use("/*",function(req, res, next){
    res.locals.optiuniMeniu=obGlobal.optiuniMeniu;
    res.locals.Drepturi=Drepturi;
    if (req.session.utilizator){
        req.utilizator=res.locals.utilizator=new Utilizator(req.session.utilizator);
    }    
    next();
});


app.set("view engine","ejs");

app.use("/resurse", express.static(__dirname+"/resurse"));
app.use("/node_modules", express.static(__dirname+"/node_modules"));

app.use(function(req, res, next){
    client.query("select * from unnest(enum_range(null::gen_carti))", function(err, rezOptiuni){
        res.locals.optiuniMeniu = rezOptiuni.rows
        next()
    })
})

const K = 4;
const intervalGenerare = '*/2 * * * *'; // la fiecare 2 minute pentru prezentare
const intervalT2 = 10 * 60 * 1000; // 10 minute în milisecunde

// Funcție pentru a genera o nouă ofertă
function genereazaOfertaNoua() {
    // Citim ofertele existente
    fs.readFile(ofertePath, (err, data) => {
        if (err) {
            console.error('Eroare la citirea fișierului oferte.json', err);
            return;
        }

        let oferte = JSON.parse(data);
        let genuri = []; 

        // Exemplu de genuri preluate din baza de date
        client.query('SELECT DISTINCT gen FROM carti', (err, result) => {
            if (err) {
                console.error('Eroare la preluarea genurilor', err);
                return;
            }

            genuri = result.rows.map(row => row.gen);

            // Selectăm o categorie aleatorie diferită de cea anterioară
            let categorieNoua;
            do {
                categorieNoua = genuri[Math.floor(Math.random() * genuri.length)];
            } while (oferte.oferte.length > 0 && oferte.oferte[0].categorie === categorieNoua);

            const reduceriPosibile = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
            const reducereAleasa = reduceriPosibile[Math.floor(Math.random() * reduceriPosibile.length)];
            const dataIncepere = new Date();
            const dataFinalizare = new Date(dataIncepere.getTime() + intervalT2);

            // Adăugăm oferta nouă la începutul vectorului
            oferte.oferte.unshift({
                categorie: categorieNoua,
                "data-incepere": dataIncepere,
                "data-finalizare": dataFinalizare,
                reducere: reducereAleasa
            });

            // Ștergem ofertele vechi
            const now = new Date();
            oferte.oferte = oferte.oferte.filter(oferta => {
                return new Date(oferta["data-finalizare"]).getTime() > now.getTime() - intervalT2;
            });

            // Scriem ofertele actualizate în fișier
            fs.writeFile(ofertePath, JSON.stringify(oferte, null, 4), (err) => {
                if (err) {
                    console.error('Eroare la scrierea fișierului oferte.json', err);
                } else {
                    console.log('Ofertă nouă generată și scrisă în fișier');
                }
            });
        });
    });
}

// Programăm sarcina să ruleze la fiecare interval specificat
cron.schedule(intervalGenerare, genereazaOfertaNoua);

function preiaOfertaCurenta() {
    const data = fs.readFileSync(ofertePath);
    const oferte = JSON.parse(data);
    return oferte.oferte.length > 0 ? oferte.oferte[0] : null;
}

app.get(["/", "/home", "/index"], function(req, res){
    const ofertaCurenta = preiaOfertaCurenta();
    res.render("pagini/index", {
        ip: req.ip,
        imagini: obGlobal.obImagini.imagini,
        ofertaCurenta: ofertaCurenta
    });
})

app.get("/produse", function(req, res){
    console.log(req.query)
    var conditieQuery="";
    if(req.query.tip){
        conditieQuery = `where editura='${req.query.tip}'`
    }

    const pagina = parseInt(req.query.pagina) || 1;
    const offset = (pagina - 1) * K;

    client.query("SELECT gen, MIN(pret) AS pret_minim FROM carti GROUP BY gen", function(err, rezultatMinim) {
        if (err) {
            console.log(err);
            afisareEroare(res, 2);
            return;
        }

        const celMaiIeftinPeCategorie = {};

        rezultatMinim.rows.forEach(function(rand) {
            celMaiIeftinPeCategorie[rand.gen] = rand.pret_minim;
        });

        client.query("select * from unnest(enum_range(null::gen_carti))", function(err, rezOptiuni){
        client.query(`select * from carti ${conditieQuery} limit ${K} offset ${offset}`, function(err, rez){
            if(err){
                console.log(err);
                afisareEroare(res, 2);
                return
            }
            /*else{
                res.render("pagini/produse", {produse: rez.rows, optiuni:rezOptiuni.rows, celMaiIeftinPeCategorie: celMaiIeftinPeCategorie } )
            }*/

            client.query(`SELECT COUNT(*) FROM carti ${conditieQuery}`, function(err, rezCount) {
                if (err) {
                    console.log(err);
                    afisareEroare(res, 2);
                    return;
                }

                const numarProduse = parseInt(rezCount.rows[0].count);
                const numarPagini = Math.ceil(numarProduse / K);
                const ofertaCurenta = preiaOfertaCurenta();
                res.render("pagini/produse", {
                    produse: rez.rows, 
                    optiuni:rezOptiuni.rows, 
                    celMaiIeftinPeCategorie: celMaiIeftinPeCategorie, 
                    numarPagini: numarPagini, 
                    paginaCurenta: pagina,
                    ofertaCurenta: ofertaCurenta} )
            })
        })
        })

    })
})


app.get("/produs/:id", function(req, res){
    client.query(`select * from carti where id=${req.params.id}`, function(err, rez){
        if(err){
            console.log(err);
            afisareEroare(res, 2);
            return
        }

        const produs = rez.rows[0]

        client.query(`select * from carti where gen = '${produs.gen}' and id != ${req.params.id}`, function(err, rezSimilare){

            if(err){
                console.log(err);
                afisareEroare(res, 2);
                return
            }

            const produseSimilare = rezSimilare.rows;

            res.render("pagini/produs", {prod: produs, produseSimilare: produseSimilare})

        });
    });
    
});

/*app.get("/produs/:id", function(req, res) {
    client.query(`SELECT * FROM carti WHERE id = $1`, [req.params.id], function(err, rezProdus) {
        if (err) {
            console.log(err);
            afisareEroare(res, 2);
            return;
        }

        const produs = rezProdus.rows[0];

        client.query(`SELECT * FROM carti WHERE gen = $1 AND id != $2`, [produs.gen, req.params.id], function(err, rezSimilare) {
            if (err) {
                console.log(err);
                afisareEroare(res, 2);
                return;
            }

            const produseSimilare = rezSimilare.rows;

            res.render("pagini/produs", { prod: produs, produseSimilare: produseSimilare });
        });
    });
});*/




/*------Utilizatori-----*/
app.post("/inregistrare",function(req, res){
    var username;
    var poza;
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier ){//4
        console.log("Inregistrare:",campuriText);


        console.log(campuriFisier);
        console.log(poza, username);
        var eroare="";


        // TO DO var utilizNou = creare utilizator
        var utilizNou =new Utilizator();
        try{
            utilizNou.setareNume=campuriText.nume[0];
            utilizNou.setareUsername=campuriText.username[0];
            utilizNou.email=campuriText.email[0]
            utilizNou.prenume=campuriText.prenume[0]
           
            utilizNou.parola=campuriText.parola[0];
            utilizNou.culoare_chat=campuriText.culoare_chat[0];
            utilizNou.poza= poza[0];
            Utilizator.getUtilizDupaUsername(campuriText.username[0], {}, function(u, parametru ,eroareUser ){
                if (eroareUser==-1){//nu exista username-ul in BD
                    //TO DO salveaza utilizator
                    utilizNou.salvareUtilizator()
                }
                else{
                    eroare+="Mai exista username-ul";
                }


                if(!eroare){
                    res.render("pagini/inregistrare", {raspuns:"Inregistrare cu succes!"})
                   
                }
                else
                    res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
            })
           


        }
        catch(e){
            console.log(e);
            eroare+= "Eroare site; reveniti mai tarziu";
            console.log(eroare);
            res.render("pagini/inregistrare", {err: "Eroare: "+eroare})
        }
   

    });

    app.post("/profil", function(req, res){
        console.log("profil");
        if (!req.session.utilizator){
            afisareEroare(res,403)
            return;
        }
        var formular= new formidable.IncomingForm();
     
        formular.parse(req,function(err, campuriText, campuriFile){
           
            var parolaCriptata=Utilizator.criptareParola(campuriText.parola[0]);
     
            AccesBD.getInstanta().updateParametrizat(
                {tabel:"utilizatori",
                campuri:["nume","prenume","email","culoare_chat"],
                valori:[
                    `${campuriText.nume[0]}`,
                    `${campuriText.prenume[0]}`,
                    `${campuriText.email[0]}`,
                    `${campuriText.culoare_chat[0]}`],
                conditiiAnd:[
                    `parola='${parolaCriptata}'`,
                    `username='${campuriText.username[0]}'`
                ]
            },         
            function(err, rez){
                if(err){
                    console.log(err);
                    afisareEroare(res,2);
                    return;
                }
                console.log(rez.rowCount);
                if (rez.rowCount==0){
                    res.render("pagini/profil",{mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                    return;
                }
                else{            
                    //actualizare sesiune
                    console.log("ceva");
                    req.session.utilizator.nume= campuriText.nume[0];
                    req.session.utilizator.prenume= campuriText.prenume[0];
                    req.session.utilizator.email= campuriText.email[0];
                    req.session.utilizator.culoare_chat= campuriText.culoare_chat[0];
                    res.locals.utilizator=req.session.utilizator;
                }
     
     
                res.render("pagini/profil",{mesaj:"Update-ul s-a realizat cu succes."});
     
            });
           
     
        });
    });

    app.get("/useri", function(req, res){
        /* TO DO
        * in if testam daca utilizatorul din sesiune are dreptul sa vizualizeze utilizatori
        * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii*/
        if(req?.utilizator?.areDreptul(Drepturi.vizualizareUtilizatori)){
            var obiectComanda= {
                tabel:"utilizatori",
                campuri: ["*"],
                conditiiAnd:[]
            };
            AccesBD.getInstanta().select(obiectComanda, function(err, rezQuery){
                console.log(err);
                res.render("pagini/useri", {useri: rezQuery.rows});
            });
            
        }
        else{
            afisareEroare(res, 403);
        }
        
    });
    
    
    
    app.post("/sterge_utiliz", function(req, res){
        /* TO DO
        * in if testam daca utilizatorul din sesiune are dreptul sa stearga utilizatori
        * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii*/
    
        if(req?.utilizator?.areDreptul(Drepturi.stergereUtilizatori)){
            var formular= new formidable.IncomingForm();
     
            formular.parse(req,function(err, campuriText, campuriFile){
                    var obiectComanda= {
                        tabel: "utilizatori",
                        conditiiAnd:[`id='${campuriText.id_utiliz[0]}'`]
                    } 
                    AccesBD.getInstanta().delete(obiectComanda, function(err, rezQuery){
                    console.log(err);
                    res.redirect("/useri");
                });
            });
        }else{
            afisareEroare(res,403);
        }
        
    });

    formular.on("field", function(nume,val){  // 1
   
        console.log(`--- ${nume}=${val}`);
       
        if(nume=="username")
            username=val;
    })
    formular.on("fileBegin", function(nume,fisier){ //2
        console.log("fileBegin");
       
        console.log(nume,fisier);
        //TO DO adaugam folderul poze_uploadate ca static si sa fie creat de aplicatie
        //TO DO in folderul poze_uploadate facem folder cu numele utilizatorului (variabila folderUser)
        var folderUser=path.join(__dirname, "poze_uploadate", username);
        if (!fs.existsSync(folderUser))
            fs.mkdirSync(folderUser)
       
        fisier.filepath=path.join(folderUser, fisier.originalFilename)
        poza=fisier.originalFilename;
        //fisier.filepath=folderUser+"/"+fisier.originalFilename
        console.log("fileBegin:",poza)
        console.log("fileBegin, fisier:",fisier)


    })    
    formular.on("file", function(nume,fisier){//3
        console.log("file");
        console.log(nume,fisier);
    });
});

app.post("/login",function(req, res){
    /*TO DO parametriCallback: cu proprietatile: request(req), response(res) si parola
        testam daca parola trimisa e cea din baza de date
        testam daca a confirmat mailul
    */
    var username;
    console.log("ceva");
    var formular= new formidable.IncomingForm()
    
    
    formular.parse(req, function(err, campuriText, campuriFisier ){
        var parametriCallback= {
            req:req,
            res:res,
            parola:campuriText.parola[0]
        }

        Utilizator.getUtilizDupaUsername (campuriText.username[0],parametriCallback, 
            function(u, obparam, eroare ){
            let parolaCriptata=Utilizator.criptareParola(obparam.parola)
            if(u.parola== parolaCriptata && u.confirmat_mail){
                u.poza=u.poza?path.join("poze_uploadate",u.username, u.poza):"";
                obparam.req.session.utilizator=u;               
                obparam.req.session.mesajLogin="Bravo! Te-ai logat!";
                obparam.res.redirect("/index");
                
            }
            else{
                console.log("Eroare logare")
                obparam.req.session.mesajLogin="Date logare incorecte sau nu a fost confirmat mailul!";
                obparam.res.redirect("/index");
            }
        })
    });
});

app.get("/logout", function(req, res){
    req.session.destroy();
    res.locals.utilizator=null;
    res.render("pagini/logout");
});

//http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}
app.get("/cod/:username/:token",function(req,res){
    /*TO DO parametriCallback: cu proprietatile: request (req) si token (luat din parametrii cererii)
        setat parametriCerere pentru a verifica daca tokenul corespunde userului
    */
    console.log(req.params);
    
    try {
        var parametriCallback= {
            req:req,
            token:req.params.token
        }
        Utilizator.getUtilizDupaUsername(req.params.username,parametriCallback ,function(u,obparam){
            let parametriCerere={
                tabel:"utilizatori",
                campuri:{
                    confirmat_mail:true
                },
                conditiiAnd:[
                    `username = '${u.username}'`,
                    `cod='${obparam.token}'`
                ]
            };
            AccesBD.getInstanta().update(
                parametriCerere, 
                function (err, rezUpdate){
                    if(err || rezUpdate.rowCount==0){
                        console.log("Cod:", err);
                        afisareEroare(res,3);
                    }
                    else{
                        res.render("pagini/confirmare.ejs");
                    }
                })
        })
    }
    catch (e){
        console.log(e);
        afisareEroare(res,2);
    }
})

/*trimiterea unui mesaj*/
app.get("/cerere", function(req, res) {
    res.send("<b>Hello!</b><span style='color:red'>world</span>");
});

/*trimiterea unui mesaj dinamic*/
app.get("/data", function(req, res, next){
    res.write("Data: ");
    next();
});

app.get("/data", function(req, res){
    res.write(""+new Date());
    res.end();
});

/*trimiterea unui mesaj dinamic in functie de parametri*/
app.get("/suma/:a/:b", function(req, res){
    var suma=parseInt(req.params.a)+parseInt(req.params.b)
    res.send(""+suma);
});

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname, "/resurse/favicon/favicon.ico"));
})

app.get(new RegExp("\/[\/a-z0-9A-Z]*\/$"), function(req, res){
    afisareEroare(res, 403);
})

app.get("/*.ejs", function(req, res){
    afisareEroare(res, 400);
})



app.get("/*", function(req, res){
    console.log(req.url);
    res.render("pagini"+req.url, function(err, rezHtml){
        console.log("Pagina: ", rezHtml);
        console.log("Eroare: "+err);
        if(err){
            if(err.message.startsWith("Failed to lookup view")){
                afisareEroare(res, 404);
                console.log("Nu a gasit pagina: ", req.url)
            }
        }
        else{
            res.send(rezHtml+"");
        }
        
    })
});


function initErori(){
    var continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    obGlobal.obErori =JSON.parse(continut);
    for(let eroare of obGlobal.obErori.info_erori){
        eroare.imagine = path.join(obGlobal.obErori.cale_baza,eroare.imagine)
    }
    obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza,obGlobal.obErori.eroare_default.imagine)
}

function afisareEroare(res, _identificator, _titlu, _text, _imagine){
    let eroare = obGlobal.obErori.info_erori.find(
        function(elem){
            return elem.identificator == _identificator
        }
    )

    if (!eroare){
        let eroare_default = obGlobal.obErori.eroare_default
        res.render("pagini/eroare", {
            titlu: _titlu || eroare_default.titlu,
            text: _text || eroare_default.text,
            imagine: _imagine || eroare_default.imagine,
        })
    }

    else{
        if(eroare.status){
            res.status(eroare.identificator)
        }

        res.render("pagini/eroare", {
            titlu: _titlu || eroare.titlu,
            text: _text || eroare.text,
            imagine: _imagine || eroare.imagine,
        })
    }
}

initErori();
//rezHtml este continutul fisierului pe care il trimitem catre client
//(continutul paginii html)

function initImagini(){
    var continut= fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini){
        [numeFis, ext]=imag.fisier.split(".");
        let caleFisAbs=path.join(caleAbs,imag.fisier);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
        imag.fisier=path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier )
        
        console.log(obGlobal.obImagini)
    }
}
initImagini();

function compileazaScss(caleScss, caleCss){
    console.log("cale:",caleCss);
    if(!caleCss){

        let numeFisExt=path.basename(caleScss);
        let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss=numeFis+".css";
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )
    

    let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup,{recursive:true})
    }

    let timestamp = new Date().getTime();
    let numeFisCss = path.basename(caleCss);
    let numeFisBackup = numeFisCss.split(".")[0] + "_" + timestamp + ".css";
    
    // la acest punct avem cai absolute in caleScss si  caleCss
    //TO DO
    if (fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css",numeFisCss ))// +(new Date()).getTime()
    }
    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css)
    //console.log("Compilare SCSS",rez);
}
//compileazaScss("a.scss");
vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}


fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    console.log(eveniment, numeFis);
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})







app.listen(8080);
console.log("Serverul a pornit");