// Functions to control the Graphical User Interface of the tool (Help document)

$('#pnum-btn').click(function(){ showHelp(pnum_title,pnum_msg,'pnum'); });
$('#hint-btn').click(function(){ showHelp(hint_title,hint_msg,'hint'); });
$('#prev-btn').click(function(){ showHelp(prev_title,prev_msg,'prev'); });
$('#rset-btn').click(function(){ showHelp(rset_title,rset_msg,'rset'); });
$('#next-btn').click(function(){ showHelp(next_title,next_msg,'next'); });
$('#eyes-btn').click(function(){ showHelp(eyes_title,eyes_msg,'eyes'); });
$('#gear-btn').click(function(){ showHelp(gear_title,gear_msg,'gear'); });
$('#dpth-btn').click(function(){ showHelp(dpth_title,dpth_msg,'dpth'); });
$('#eval-btn').click(function(){ showHelp(eval_title,eval_msg,'eval'); });
$('#rbot-btn').click(function(){ showHelp(rbot_title,rbot_msg,'rbot'); });
$('#edit-btn').click(function(){ showHelp(edit_title,edit_msg,'edit'); });
$('#shot-btn').click(function(){ showHelp(shot_title,shot_msg,'shot'); });
$('#bell-btn').click(function(){ showHelp(bell_title,bell_msg,'bell'); });
$('#tags-btn').click(function(){ showHelp(tags_title,tags_msg,'tags'); });
$('#rand-btn').click(function(){ showHelp(rand_title,rand_msg,'rand'); });
$('#bomb-btn').click(function(){ showHelp(bomb_title,bomb_msg,'bomb'); });
$('#errs-btn').click(function(){ showHelp(errs_title,errs_msg,'errs'); });
$('#tree-btn').click(function(){ showHelp(tree_title,tree_msg,'tree'); });
$('#pass-btn').click(function(){ showHelp(pass_title,pass_msg,'pass'); });

$('#book-btn').click(function(){ showHelp(book_title,book_msg,'book'); });
$('#puzz-btn').click(function(){ showHelp(puzz_title,puzz_msg,'puzz'); });
$('#endb-btn').click(function(){ showHelp(endb_title,endb_msg,'endb'); });
$('#game-btn').click(function(){ showHelp(game_title,game_msg,'game'); });
$('#help-btn').click(function(){ showHelp(help_title,help_msg,'help'); });

function appearEffect(title) {
    // Wrap every letter in a span
    var textWrapper = document.querySelector('.ml1 .letters');
    textWrapper.innerHTML = title.replace(/\S/g, "<span class='letter'>$&</span>");

    anime.timeline({loop: false})
        .add({
            targets: '.ml1 .letter',
            scale: [0.3,1],
            opacity: [0,1],
            translateZ: 0,
            easing: "easeOutExpo",
            duration: 600,
            delay: (el, i) => (80 - 4*title.length) * (i+1)
        });
};

function disolve(element, i){
    if (i <= 10){
        element.css('opacity', 0.1*i);
        setTimeout(function(){ disolve(element, i+1) }, 70-10*i);
    }
}

function showHelp(title, msg, btn) {
    $('#helpTitle').css('visibility', 'hidden');
    $('#helpMsg').css('opacity', 0);

    var joined_msg = ''
    for (var i = 0; i < msg.length; i++){
        joined_msg += '<p>' + msg[i] + '</p>';
        if (i < msg.length - 1){ joined_msg += '<hr>'; }
    }

    document.getElementById('helpMsg').innerHTML = joined_msg;
    disolve($('#helpMsg'), 1);

    appearEffect(title);
    setTimeout(function(){ $('#helpTitle').css('visibility', 'visible'); }, 50);

    $('.btn-help').removeClass('btn-help');
    $('#' + btn + '-btn').addClass('btn-help');
}

pnum_title = 'Índice';
pnum_msg   = ['Éste es el número identificativo del problema.',
              'Al hacer <i>click</i> en este botón, se mostrará (durante un instante) el número total de problemas en el bloque de ejercicios.'];

hint_title = 'Consejo';
hint_msg   = ['Haz <i>click</i> para ver una pista sobre cómo proceder en la posición actual.',
              'En el <i>modo robot</i> no se debe confiar ciegamente en la calidad del consejo, ya que éste se calcula mediante Stockfish a profundidad no muy elevada.'];

prev_title = 'Problema anterior';
prev_msg   = ['Este botón carga el problema anterior al actual.',
              'Cuando el <i>modo edición libre</i> esté activo, este botón permitirá deshacer una jugada.'];

rset_title = 'Repetir problema';
rset_msg   = ['Vuelve a cargar el problema actual para resolverlo de nuevo.'];

next_title = 'Siguiente problema';
next_msg   = ['Este botón carga el problema siguiente al actual.',
              'Cuando el <i>modo edición libre</i> esté activo, este botón permitirá rehacer una jugada.'];

eyes_title = 'Ver evaluación';
eyes_msg   = ['Permite mostrar u ocultar la evaluación de las posiciones (en aquéllas en las que esté disponible o haya sido calculada).'];

gear_title = 'Motor';
gear_msg   = ['Evalúa la posición actual con Stockfish. Tanto la evaluación como la profundidad de cálculo aparecerán a la izquierda del botón.',
              'El primer análisis en cada posición se hace durante 1 segundo. A continuación, se puede incrementar la profundidad haciendo <i>click</i> en el botón de profundidad.'];

dpth_title = 'Profundidad';
dpth_msg   = ['Este botón indica la profundidad con la que se ha calculado la evaluación de la posición. Al hacer <i>click</i> en él, la posición se evaluará de nuevo con un grado más de profundidad.',
              'Analizar posiciones a alta profundidad puede suponer un gasto energético alto, sobre todo para un teléfono móvil.'];

eval_title = 'Evaluación';
eval_msg   = ['Muestra la evaluación de la posición actual desde el punto de vista de las blancas.',
              'El color de fondo será verde o rojo en función de si la posición favorece tu bando o no (respectivamente).',
              'Al hacer <i>click</i> en este botón, se mostrará la mejor jugada propuesta por la evaluación.'];

rbot_title = 'Modo robot';
rbot_msg   = ['Este modo te permite jugar contra Stockfish en la posición actual del tablero.',
              'Es especialmente útil para practicar a mantener la ventaja en posiciones en las que tienes dudas.'];

edit_title = 'Modo edición libre';
edit_msg   = ['Cuando este modo esté activado, podrás mover las piezas libremente en el tablero, para llegar a una posición de tu interés.',
              'Este modo es incompatible con muchas funciones, que estarán desactivadas mientras esté activo.'];

shot_title = 'Fotogramas';
shot_msg   = ['Al hacer <i>click</i> en este botón, se mostrarán posiciones similares a la actual en las que la jugada recomendada es la misma.',
              'Este modo es incompatible con muchas funciones, que estarán desactivadas mientras esté activo.'];

bell_title = 'Campana';
bell_msg   = ['Activa o desactiva el sonido de la campana que se reproduce al acertar un ejercicio.',
              'La idea de dicho sonido es favorecer la memorización a través del sentido del oído.'];

tags_title = 'Etiquetas';
tags_msg   =  ['Este botón te permite saltar directamente a posiciones particularmente interesantes del bloque de problemas actual.',
               'En el caso de estudio de aperturas, permite saltar a posiciones correspondientes a las variantes principales.'];

rand_title = 'Modo aleatorio';
rand_msg   = ['Cuando este modo esté activado, los problemas aparecerán en un orden aleatorio (en lugar de secuencial).',
              'Practicar en este modo de vez en cuando es recomandable para evitar asociaciones entre problemas vecinos.'];

bomb_title = 'Bombazos';
bomb_msg   = ['Este botón te permite iterar por posiciones en las que hay un truco táctico o una jugada sorprendente (para tu bando).',
              'Es recomendable estudiar estas posiciones con algo más de frecuencia para no dejar escapar oportunidades en tus partidas.'];

errs_title = 'Corrige tus errores';
errs_msg   = ['Haz <i>click</i> en este botón cuando muestre el símbolo <span class="fa fa-warning"></span> para resolver de nuevo posiciones en las que te has equivocado previamente.',
              'Cuando resuelvas correctamente todas las posiciones con errores, el botón volverá al estado <span class="fa fa-check-circle"></span>.'];

tree_title = 'Ramificación';
tree_msg   = ['Este botón te permite controlar el nivel de ramificación de los problemas, para no distraerte con variantes más profundas.',
              'Se ignorarán las posiciones cuyo número de jugadas desde la posición inicial es mayor que el indicado.', 'Haciendo <i>doble click</i> se elimina el límite.'];

book_title = 'Modo aperturas';
book_msg   = ['Modo diseñado para el estudio de aperturas.',
              'Este botón abrirá una nueva ventana donde podrás seleccionar la apertura a estudiar.',
              'En cada posición (aunque varias jugadas sean buenas) sólo hay una jugada válida, correspondiente a la variante prediseñada para el estudio.'];

puzz_title = 'Modo táctica';
puzz_msg   = ['Modo diseñado para el estudio de táctica y ataque. Por momento contiene planes de ataque de partidas famosas.'];


endb_title = 'Modo finales';
endb_msg   = ['Modo diseñado para el estudio de finales.<br><br><b>Aún no está disponible.</b>'];

game_title = 'Modo partida';
game_msg   = ['Cuando este modo esté activo, jugarás contra la máquina variantes completas del libro de aperturas seleccionado.', 'En este modo no se muestra la jugada prediseñada después de cada error.'];

help_title = 'Ayuda';
help_msg   = ['Pincha en cada botón para obtener información sobre sus funcionalidades.',
              'Para volver al menú principal, pulsa en el link de <i>Volver</i> situado arriba a la derecha.'];


showHelp(help_title, help_msg, 'help');
