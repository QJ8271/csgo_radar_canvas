const canvas = document.getElementById("radar");
const ctx = canvas.getContext("2d");
const map = document.getElementById("map");
const base_data_path = "/data";

// radar images are 1024x1024, we are scaling them down to 512x512
let ratio = 0.5;

let pos_x;
let pos_y;
let scale;
let player_dot_size = 6;


let prev_map_name = "de_dust2";
let last_updated = [];

var dropdown = document.getElementById("metric");
var map_style = document.getElementById("map_style");


function addenemy (name, health, weapon, last_place) {
    let enemy_list = document.getElementById('enemy_list');
   // create new li element
    let li = document.createElement('li');
    li.textContent = name + " | " + weapon + " | " + last_place;
    li.setAttribute("class", "list-group-item");

    let progress = document.createElement('div');
    progress.setAttribute("class", "progress");

    let col_red = (255 - 2.55 * health);
    let col_green = (2.55 * health);
    let col_blue = 0;

    const style = "width:" + health + "%; background-color: rgb(" + col_red + "," + col_green + "," + col_blue + ");";
    let progress_bar = document.createElement('div');
    progress_bar.setAttribute("class", "progress-bar");
    progress_bar.setAttribute("role", "progressbar");
    progress_bar.setAttribute("aira-valuenow", health);
    progress_bar.setAttribute("aria-valuemin", "0");
    progress_bar.setAttribute("aria-valuemax", "100");
    progress_bar.setAttribute("style", style);
    progress_bar.textContent = health + "HP";

    progress.appendChild(progress_bar);
    li.appendChild(progress);
    enemy_list.appendChild(li)
}


map_style.onchange = function(){
    var map_name = dropdown.options[dropdown.selectedIndex].value;
    var m_style = map_style.value;
    prev_map_name = map_name;
   
    if(m_style == "classic"){
        image.src = base_data_path + "/images/" + map_name + "_radar.png";
    }else{
        image.src = base_data_path + "/maps/" + map_name + "/radar.png";
    }
    update_map_data(map_name);
    last_updated = [];
}

dropdown.onchange = function() { 
    var map_name = dropdown.options[dropdown.selectedIndex].value;
    var m_style = map_style.options[map_style.selectedIndex].value;
    if (prev_map_name != map_name) {
        prev_map_name = map_name;
       
        if(m_style == "classic"){
            image.src = base_data_path + "/images/" + map_name + "_radar.png";
        }else{
            image.src = base_data_path + "/maps/" + map_name + "/radar.png";
        }
        update_map_data(map_name);
        last_updated = [];
    } 
}

function update_map_data(map_name){
    let maps = {'de_dust2':[-2476,3239,4.4] ,'de_inferno': [-2087,3870,4.9],
                'de_vertigo':[-3168,1762,4], 'de_nuke': [-3453, 2887, 7],
                'de_mirage':[-3230, 1713, 5]}
    pos_x = maps[map_name][0]
    pos_y = maps[map_name][1]
    scale = maps[map_name][2]
}

function update_radar_scale() {
	ratio =  document.getElementById("radar_scale").value;
}

function update_player_scale() {
	player_dot_size =  document.getElementById("player_dot_size").value;
}

    function draw_local_entity(ang){
        ctx.beginPath();
            ctx.arc(0, 0, player_dot_size, 0, 2 * Math.PI, false)
            ctx.fillStyle = `rgb(${ 0 }, ${ 255 }, ${ 255 }, ${ 255 })`;
            ctx.fill();
        draw_arrow(0, 0, ang)
        ctx.closePath();
    }

function draw_entity(x, y, health, last_place, r, g, b, a, weapon, ang, local_player, local_x, local_y, name) {
    ctx.beginPath();
    ctx.arc(x, y, player_dot_size, 0, 2 * Math.PI, false)

    ctx.fillStyle = `rgb(${ r }, ${ g }, ${ b }, ${ a })`;
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((-local_player["angle_y"] + 90) * Math.PI / 180);
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "bold 12px Verdana";
    if(name_radio.checked){
        ctx.fillText(name, 5, -15);
    }
    if(health_radio.checked){
        ctx.fillText(health, 5, 20);
    }
    if(weapon_radio.checked){
        ctx.fillText(weapon, 5, -30);
    }
    if(defusing){
        ctx.fillText("DEFUSING", 10, 0);
    }
    ctx.restore();
   
    draw_arrow(x, y, ang)
}

function draw_arrow(x, y, ang){
     if(ang == undefined){
        return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((-ang + 90) * Math.PI / 180);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(-player_dot_size, -player_dot_size);
    ctx.lineTo(0, -player_dot_size*2);
    ctx.lineTo(player_dot_size, -player_dot_size);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}



function clear_canvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function normalize(val, min, max) {
    const clamped_val = Math.min(Math.max(val, min), max);

    return (clamped_val - min) / (max - min);
}

function clearEnemyList() {
    document.getElementById("enemy_list").innerHTML = "";
}

image = new Image();
image.src = base_data_path + '/maps/de_dust2/radar.png';
let healths = [];
let x_positions = [];
let y_positions = [];
let local_x = 0;
let local_y = 0;
let weapons = [];
let ang_ys = [];
let local_player;
let enemy_list = [];
let image_scale = 512;

var socket = io.connect();
socket.on("updateData", function (event) {
    const obj = JSON.parse(event.data);
    const map_name = obj.map.name;
    for(const i in obj.players){
        if (obj.player.isLocalPlayer) {
        local_player = i
        }
    }
    enemy_list = obj["enemy_list"];
    healths = obj["healths"];
    x_positions = obj["x_positions"];
    y_positions = obj["y_positions"];
    local_x = obj["local_x"];
    local_y = obj["local_y"];
    weapons = obj["weapon"];
    ang_ys = obj["ang_y"];
    local_angle_y = obj["local_ang_y"];
    console.log(map_name);
    console.log(local_player);
/*
    clear_canvas();
    ctx.save();
    update_map_data(map_name);

    if(!local_player)
        return;

    local_x = ((local_player["pos_x"] - pos_x) / scale ) * ratio;
    local_y = ((local_player["pos_y"] - pos_y) / -scale ) * ratio;

    const image_scale = 1024 * ratio;

    ctx.translate(300, 300);
    ctx.rotate((local_player["angle_y"] - 90) * Math.PI / 180);
    canvas.hidden = true;
    ctx.drawImage(image, -local_x, -local_y,  image_scale,  image_scale);
    ctx.globalCompositeOperation = "destination-in";

      // draw our circle mask
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(
        0, // x
        0, // y
        270, // radius
        0, // start angle`
        2 * Math.PI // end angle
    );
    ctx.fill();

      // restore to default composite operation (is draw over current image)
    ctx.globalCompositeOperation = "source-over";

    canvas.hidden = false
    
    const now_ms = new Date().getTime();
    clearEnemyList();

    for(const i in enemy_list) {
        const mapped_x = ((enemy_list[i]["pos_x"] - pos_x) / scale) * ratio - local_x;
        const mapped_y = ((enemy_list[i]["pos_y"] - pos_y) / -scale) * ratio  - local_y;
        let col_red = (255 - 2.55 * enemy_list[i]["health"]);
        let col_green = (2.55 * enemy_list[i]["health"]);
        let col_blue = 0;
        draw_entity(mapped_x,
                    mapped_y,
                    enemy_list[i]["health"],
                    enemy_list[i]["last_place"],
                    col_red, col_green, col_blue, 255,
                    0, enemy_list[i]["is_defusing"],
                    enemy_list[i]["weapon"],
                    enemy_list[i]["angle_y"],
                    local_player,
                    local_x,
                    local_y,
                    enemy_list[i]["name"]);
        addenemy(enemy_list[i]["name"], enemy_list[i]["health"], enemy_list[i]["weapon"]);
    }


    draw_local_entity(local_player["angle_y"] );
    ctx.restore();
*/
});