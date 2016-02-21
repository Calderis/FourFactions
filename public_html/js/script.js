var cmp = 0,
    nbQuest = 0,
    choices = [],
    tabQuestions = [
        [{question:'COMMENT PRENDS-TU LA CRITIQUE OU LES OPINIONS CONTRAIRES À LA TIENNE ?'},{rep1:'Essaye de me critiquer pour voir!',rep2:'Peu m\’importe, j\’ai toujours raison.',rep3:'Je suis très ouvert à la conversation.','rep4':'J\’arrive toujours à rallier mon interlocuteur à ma cause'}],
        [{question:'TA DEVISE C’EST …'},{rep1:'La vengeance est un plat qui se mange froid.',rep2:'Force et honneur.',rep3:'Que la Force soit avec vous.',rep4:'Les bons comptes font les bons amis.'}],
        [{question:'TA BONNE RÉSOLUTION POUR LA RENTRÉE…'},{rep1:'Pourquoi prendre de bonnes résolutions quand on peut en prendre des mauvaises.',rep2:'Défendre la veuve et l’orphelin.',rep3:'Aider les jeunes à se forger un avenir radieux.',rep4:'Prendre soin de toi avant tout.'}],
        [{question:'FACE AU DANGER…'},{rep1:'Tout dépend du contrat.',rep2:'Si des amis y sont exposés, tu fonces. Sinon tu te tires.',rep3:'Tu ne recule jamais face au danger.',rep4:'Tu te caches.'}],
        [{question:'TON MOYEN DE TRANSPORT C\’EST …'},{rep1:'Un Super Destroyer Stellaire. Au minimum.',rep2:'X-Wing.',rep3:'Snowspeeder.',rep4:'Un Cargo classique.'}],
        [{question:'TON ARME FAVORITE C\’EST …'},{rep1:'La Force, et les sabres laser.',rep2:'Les pistolet lasers.',rep3:'Les sabres laser, et la Force.',rep4:'L’argent.'}],
    ],
    tabReponses = [0,0,0,0];


$(function(){

    /* Display lightobx play choices (click on "jouer" button) */
    //
    $('.play').click(function(){
        if($('.light-play').css("display","none")){
            $('.light-play').css("display","block");
        }
    });
    /* close lightobx play choices (click on the cross) */
    //
    $('.close').click(function() {
        $('.light-play').css("display","none");
    });

    /* Horizontal navigation */
    //
    $('.next').click(function () {
        $(this).parent().parent().animate({
            marginLeft: '-25%'
        }, 500);
    });
    $('.prev').click(function () {
        $(this).parent().parent().prev().animate({
            marginLeft: '0'
        }, 500);
    });


    /* If there's no question displayed */
    if(nbQuest == 0){
        $('.form-test').css("display","block");
        $('.form-test input[type=radio]').css("display","none");
    }

    $('.next-question').click(function(){
        $(this).css("background-color","#333333");
        $('#questions p:nth-child(2)').css("display","none")
    });

    $('.form-test').change(function(){
        // $(this).css("display","none");
        $('.next-question').css("display","block");
        $('.next-question').css("background-color","#808080");
    });

    /* On click "Démarrer le questionnaire" update answers */
    $('.next-question').click(function(e) {

        $('.form-test input[type=radio]').css("display","block");
        $('.next-question').attr("value","Question suivante");

        var radioClass = $('input[name=option]:checked').attr('class');
        validateQuest(radioClass);
        nbQuest+=1;

        if(nbQuest == 1){
            var radio1 = tabQuestions[0][1].rep1;
            var radio2 = tabQuestions[0][1].rep2;
            var radio3 = tabQuestions[0][1].rep3;
            var radio4 = tabQuestions[0][1].rep4;
            var question = tabQuestions[0][0].question;   
        }else if(nbQuest == 2){
            var radio1 = tabQuestions[1][1].rep1;
            var radio2 = tabQuestions[1][1].rep2;
            var radio3 = tabQuestions[1][1].rep3;
            var radio4 = tabQuestions[1][1].rep4;
            var question = tabQuestions[1][0].question;
        }else if(nbQuest == 3){
            var radio1 = tabQuestions[2][1].rep1;
            var radio2 = tabQuestions[2][1].rep2;
            var radio3 = tabQuestions[2][1].rep3;
            var radio4 = tabQuestions[2][1].rep4;
            var question = tabQuestions[2][0].question;
        }else if(nbQuest == 4){
            var radio1 = tabQuestions[3][1].rep1;
            var radio2 = tabQuestions[3][1].rep2;
            var radio3 = tabQuestions[3][1].rep3;
            var radio4 = tabQuestions[3][1].rep4;
            var question = tabQuestions[3][0].question;
        }else if(nbQuest == 5){
            var radio1 = tabQuestions[4][1].rep1;
            var radio2 = tabQuestions[4][1].rep2;
            var radio3 = tabQuestions[4][1].rep3;
            var radio4 = tabQuestions[4][1].rep4;
            var question = tabQuestions[4][0].question;
        }else if(nbQuest == 6){
            var radio1 = tabQuestions[5][1].rep1;
            var radio2 = tabQuestions[5][1].rep2;
            var radio3 = tabQuestions[5][1].rep3;
            var radio4 = tabQuestions[5][1].rep4;
            var question = tabQuestions[5][0].question;
        }
        $("input:radio[name='radio1']").val(radio1);
        $("input:radio[name='radio2']").val(radio2);
        $("input:radio[name='radio3']").val(radio3);
        $("input:radio[name='radio4']").val(radio4);

        $('.span1').html(radio1); 
        $('.span2').html(radio2); 
        $('.span3').html(radio3); 
        $('.span4').html(radio4); 
        $('.question').html(question); 
    });

    /* Insert value into radio buttons 6 times */
    function validateQuest(radioClass){
        switch(radioClass){
            case 'radio1':
                tabReponses[0]+=1;
            break;

            case 'radio2':
                tabReponses[1]+=1;
            break;

            case 'radio3':
                tabReponses[2]+=1;
            break;

            case 'radio4':
                tabReponses[3]+=1;
            break;
        }

        cmp = cmp+1;

        if(cmp == 7){
            validateTest(tabReponses);
            $('.form-test').css("display","none");
        }
    }
});

/* Put in an array the index of categorie most checked*/
function validateTest(tabReponses) {
    var max = 0;
    for(var i = 0; i<tabReponses.length; i++){
        
        if(tabReponses[i] > max){
            max = tabReponses[i];
            choices[0] = i;
            
        }
        else if(tabReponses[i]==max && max != 0){
            choices.push(i);
            
        }
    }
    var choice = choices[Math.floor(Math.random()*choices.length)];
    chooseProfile(choice);
    return choice;
}

/* Update profile content, depend on your answers */
function chooseProfile(choice){
    $('.profile').css("display","block");
    $('.your-profile p').css("display","block");
    var questions = $('#questions');
    questions.css("width","80%");
    questions.css("padding","40px 0px");

    switch(choice){
        case 0:
            sessionStorage.setItem("team","Empire");
            $('.your-profile h2 span').html(" : Empire");
            $('.your-profile p').html("Seigneur Sith de L\’Empire<br/>Combattant hors norme, sans pitié et attiré par le coté obscure de la Force, vous êtes sans aucun doute un soldat de L\’Empire. Votre sournoiserie et votre puissance feront de vous un atout considérable lors des batailles livrés face aux factions adverse.");
            $('.profile img').attr("src","img/empire-profil.jpg");
            $('.profile img').attr("alt","Profil empire");
        break;
        case 1:
            sessionStorage.setItem("team","Rebel");
            $('.your-profile h2 span').html(" : Rebel");
            $('.your-profile p').html("Soldat de l\’Alliance Rebelle<br/>Excellent pilote et fervent défenseur des liberté, vous êtes à coup sûr un soldat de l\’Alliance Rebelle. Votre courage et votre dextérité au volant feront de vous un facteur de victoire lors de vos multiples combat pour la liberté.");
            $('.profile img').attr("src","img/rebellion-profil.jpg");
            $('.profile img').attr("alt","Profil rebel");
        break;
        case 2:
            sessionStorage.setItem("team","Republic");
            $('.your-profile h2 span').html(" : République");
            $('.your-profile p').html("Jedi de la République<br/>Fine lame, sagesse et Force lumineuse sont les mots qui vous caractérisent. Vous rejoindrez les Jedi dans leur combat permanent contre les forces du mal. Votre attitude noble et votre dévouement pour protéger les innocents feront de vous un atout de taille dans la lutte contre l\’Ordre des Sith qui a constitué l\’Empire.");
            $('.profile img').attr("src","img/republique-profil.jpg");
            $('.profile img').attr("alt","Profil republique");
        break;
        case 3:
            sessionStorage.setItem("team","Droid");
            $('.your-profile h2 span').html(" : Fédération du commerce");
            $('.your-profile p').html("Droïd de la Fédération du Commerce<br/>Robuste et rationnel, c\’est sans surprise que vous serez affecté à l\’armée de la Fédération du Commerce.Votre intelligence et analyse parfaite de chaque situation feront de vous un pièce maîtresse des infanteries de cette faction.");
            $('.profile img').attr("src","img/federation-profil.jpg");
            $('.profile img').attr("alt","Profil commerce");
        break;
    }
}




