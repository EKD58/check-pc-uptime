"use strict";

var from_day;
var to_day;
var delta_minutes;

var files_workhours;
var files_pcuptime;

var text_workhours = [];
var text_pcuptime = [];

var file_read_count_workhours = 0;
var file_read_count_pcuptime = 0;

var result_array = [];



const getDateFullString = function (dt) {
    return dt.getFullYear().toString() + "/" +
        ('0' + (dt.getMonth() + 1).toString()).slice(-2) + "/" +
        ('0' + dt.getDate().toString()).slice(-2) + " " +
        ('0' + dt.getHours().toString()).slice(-2) + ":" +
        ('0' + dt.getMinutes().toString()).slice(-2) + ":" +
        ('0' + dt.getSeconds().toString()).slice(-2);
}


const getDateString = function (dt) {
    return dt.getFullYear().toString() + "/" +
        ('0' + (dt.getMonth() + 1).toString()).slice(-2) + "/" +
        ('0' + dt.getDate().toString()).slice(-2);
}


const getDateString2 = function (dt) {
    const dayOfWeek = dt.getDay();
    const dayOfWeekStr = ["日", "月", "火", "水", "木", "金", "土"][dayOfWeek];
    return ('0' + (dt.getMonth() + 1).toString()).slice(-2) + "/" + ('0' + dt.getDate().toString()).slice(-2) + "(" + dayOfWeekStr + ")";
}


const getTimeString = function (dt) {
    let str = ('0' + dt.getHours().toString()).slice(-2) + ":" + ('0' + dt.getMinutes().toString()).slice(-2);
    if (str === "00:00") {
        str = "--:--";
    }
    return str;
}


const readFile = function (type, file) {
    const element_check_result = document.getElementById('check_result');

    if (!file) {
        const message = file + " が正しく読み込めませんでした";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    //console.log("ReadFile " + file.name);
    //console.log("ReadFile " + file.size);
    //console.log("ReadFile " + file.type);
    //console.log("ReadFile " + getDateFullString(file.lastModifiedDate));

    const file_reader = new FileReader();

    file_reader.onload = function (event) {
        const message = file.name + "の読み込みが成功しました";
        console.log(message);
        element_check_result.innerHTML = message;

        if (type === "workhours") {
            text_workhours.push(file_reader.result);

            file_read_count_workhours++;
            if (file_read_count_workhours >= files_workhours.length) {
                // pcuptime読み込み開始
                setTimeout(readFile, 1000, "pcuptime", files_pcuptime[file_read_count_pcuptime]);
                return;
            }
            // workhours読み込み継続
            setTimeout(readFile, 1000, "workhours", files_workhours[file_read_count_workhours]);
        }
        if (type === "pcuptime") {
            text_pcuptime.push(file_reader.result);

            file_read_count_pcuptime++;
            if (file_read_count_pcuptime >= files_pcuptime.length) {
                // result_array 初期値設定
                setTimeout(setResultDefault, 1000);
                return;
            }
            // pcuptime読み込み継続
            setTimeout(readFile, 1000, "pcuptime", files_pcuptime[file_read_count_pcuptime]);
        }
        return;
    }
    file_reader.onerror = function (event) {
        const message = file.name + "の読み込みが失敗した" + event;
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    file_reader.onloadstart = function (event) {
        const message = file.name + "の読み込みを開始した";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    file_reader.onprogress = function (event) {
        const message = file.name + "の読み込中: " + event.loaded + " / " + event.total + "Byte";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    file_reader.onloadend = function (event) {
        const message = file.name + "の読み込みが完了した";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }

    file_reader.readAsText(file);
    return;
}


const setResultDefault = function () {
    // メンバ抽出
    let target_array = [];
    for (let i = 0; i < files_workhours.length; i++) {
        const file_split = files_workhours[i].name.split('_');
        if (file_split.length !== 4) {
            console.log("skip " + files_workhours[i].name);
            continue;
        }
        if (file_split[0] !== "勤怠詳細") {
            console.log("skip " + files_workhours[i].name);
            continue;
        }
        const target = file_split[1];
        let found_flag = false;
        for (let j = 0; j < target_array.length; j++) {
            if (target_array[j] !== target) {
                continue;
            }
            found_flag = true;
            break;
        }
        if (found_flag !== false) {
            continue;
        }
        target_array.push(target);
    }

    // result初期値設定
    for (let i = 0; i < target_array.length; i++) {
        let target_name = target_array[i].replace(/\s+/g, "");
        result_array.push({ name: target_name, result: [] });

        for (let d = new Date(from_day.getTime()); d <= to_day; d.setDate(d.getDate() + 1)) {
            let d_tomorrow = new Date(d.getTime());
            d_tomorrow.setDate(d_tomorrow.getDate() + 1)

            let date = new Date(d.getTime());
            let work_begin_time = new Date(d_tomorrow.getTime());
            let work_finish_time = new Date(d.getTime());
            let pc_begin_time = new Date(d_tomorrow.getTime());
            let pc_finish_time = new Date(d.getTime());
            result_array[i].result.push({ date: date, result: "", work_begin_time: work_begin_time, work_finish_time: work_finish_time, pc_begin_time: pc_begin_time, pc_finish_time: pc_finish_time });
        }
    }

    setTimeout(setWorkhourstime, 1000);

    return;
}


const setWorkhoursLine = function (line, name_index, date_index, begin_index, finish_index) {
    let param_split = line.split(",");

    if (param_split.length < 7) {
        return;
    }
    const param_name = param_split[name_index].replace(/\s+/g, "");

    const param_date = new Date(param_split[date_index].replace(/\"/g, ""));
    const param_date_string = getDateString(param_date);

    const param_begin_date = new Date(param_date_string + " " + param_split[begin_index]);

    const param_finish_date = new Date(param_date_string + " " + param_split[finish_index]);

    let found_flag = false;
    for (let i = 0; i < result_array.length; i++) {
        if (param_name != result_array[i].name) {
            continue;
        }
        for (let j = 0; j < result_array[i].result.length; j++) {

            const resutl_date_string = getDateString(result_array[i].result[j].date);
            if (param_date_string != resutl_date_string) {
                continue;
            }
            found_flag = true;
            result_array[i].result[j].work_begin_time = new Date(param_begin_date.getTime());
            result_array[i].result[j].work_finish_time = new Date(param_finish_date.getTime());
            break;
        }
        if (found_flag === false) {
            continue;
        }
        break;
    }
    return;
}

const setWorkhourstime = function () {
    const element_check_result = document.getElementById('check_result');
    {
        const message = "勤怠日時CSVファイルのチェックを開始します";
        console.log(message);
        element_check_result.innerHTML = message;
    }

    let count = 0;
    for (let i = 0; i < text_workhours.length; i++) {
        let line_split = text_workhours[i].split(/\r\n|\n/);

        // 最初の行
        let name_index = -1;
        let date_index = -1;
        let begin_index = -1;
        let finish_index = -1;
        const param_split = line_split[0].split(",");
        for (let j = 0; j < param_split.length; j++) {
            const param_name = param_split[j].replace(/\"/g, "");
            if (param_name == "氏名") {
                name_index = j;
            }
            if (param_name == "日付") {
                date_index = j;
            }
            if (param_name == "始業時刻") {
                begin_index = j;
            }
            if (param_name == "終業時刻") {
                finish_index = j;
            }
        }
        if (name_index < 0) {
            continue;
        }
        if (date_index < 0) {
            continue;
        }
        if (begin_index < 0) {
            continue;
        }
        if (finish_index < 0) {
            continue;
        }

        // 2行目以降
        for (let j = 1; j < line_split.length; j++) {
            setWorkhoursLine(line_split[j], name_index, date_index, begin_index, finish_index);

            count++;
        }
    }

    {
        const message = "勤怠日時CSVファイルのチェックが完了しました";
        console.log(message);
        element_check_result.innerHTML = message;
    }
    setTimeout(setPcUptime, 1000);
    return;
}


const setPcUptimeLine = function (line, user_index) {
    let param_split = line.split(",");

    if (param_split.length < 16) {
        return;
    }

    const param_name = param_split[user_index].replace(/\"/g, "");

    const param_date = new Date(param_split[0].replace(/\"/g, ""));
    const param_date_string = getDateString(param_date);

    let found_flag = false;
    for (let i = 0; i < result_array.length; i++) {
        if (param_name != result_array[i].name) {
            continue;
        }
        for (let j = 0; j < result_array[i].result.length; j++) {
            const resutl_date_string = getDateString(result_array[i].result[j].date);
            if (param_date_string != resutl_date_string) {
                continue;
            }
            found_flag = true;
            if (result_array[i].result[j].pc_begin_time > param_date) {
                result_array[i].result[j].pc_begin_time = new Date(param_date.getTime());
            }
            if (result_array[i].result[j].pc_finish_time < param_date) {
                result_array[i].result[j].pc_finish_time = new Date(param_date.getTime());
            }
            break;
        }
        if (found_flag === false) {
            continue;
        }
        break;
    }
    return;
}


const setPcUptime = function () {
    const element_check_result = document.getElementById('check_result');
    {
        const message = "PCログCSVファイルのチェックを開始します";
        console.log(message);
        element_check_result.innerHTML = message;
    }

    let count = 0;
    for (let i = 0; i < text_pcuptime.length; i++) {
        let line_split = text_pcuptime[i].split(/\r\n|\n/);

        // 最初の行
        let user_index = -1;
        const param_split = line_split[0].split(",");
        for (let j = 0; j < param_split.length; j++) {
            const param_name = param_split[j].replace(/\"/g, "");
            if (param_name !== "使用者名") {
                continue;
            }
            user_index = j;
            break;
        }
        if (user_index < 0) {
            continue;
        }

        // 2行目以降
        for (let j = 1; j < line_split.length; j++) {
            setPcUptimeLine(line_split[j], user_index);

            count++;
        }
    }

    {
        const message = "PCログCSVファイルのチェック完了しました";
        console.log(message);
        element_check_result.innerHTML = message;
    }

    const delta_milliseconds = delta_minutes * 60 * 1000;
    // whなし　pcなし　→OK
    // whなし　pcあり　→NG
    // whあり　pcなし　→NG
    // whあり　pcあり　→wh時刻よりも20分差異の場合NG
    for (let i = 0; i < result_array.length; i++) {
        for (let j = 0; j < result_array[i].result.length; j++) {
            let result = "NG";
            const ra = result_array[i].result[j];
            const work_begin_time = getTimeString(ra.work_begin_time);
            const work_finish_time = getTimeString(ra.work_finish_time);
            const pc_begin_time = getTimeString(ra.pc_begin_time);
            const pc_finish_time = getTimeString(ra.pc_finish_time);
            const work_flag = (work_begin_time != "--:--") && (work_finish_time != "--:--");
            const pc_flag = (pc_begin_time != "--:--") && (pc_finish_time != "--:--");

            if (work_flag) {
                // whあり
                if (pc_flag) {
                    // pcあり
                    const diff_begin = Math.abs(ra.work_begin_time.getTime() - ra.pc_begin_time.getTime());
                    const diff_finish = Math.abs(ra.work_finish_time.getTime() - ra.pc_finish_time.getTime());
                    if ((diff_begin < delta_milliseconds) && (diff_finish < delta_milliseconds)) {
                        result = "OK";
                    }
                } else {
                    // pcなし
                }
            } else {
                // whなし
                if (pc_flag) {
                    // pcあり
                } else {
                    // pcなし
                    result = "OK";
                }
            }
            ra.result = result;
        }
    }

    setTimeout(setCheckResult, 1000);

    return;
}

function setCheckResult() {
    const element_check_result = document.getElementById('check_result');

    {
        const message = "チェックが完了しました　↓↓↓";
        console.log(message);
        element_check_result.innerHTML = message;
    }

    // result出力
    for (let i = 0; i < result_array.length; i++) {
        for (let j = 0; j < result_array[i].result.length; j++) {
            //console.log("[result] name:" + result_array[i].name +
            //    " date:" + getDateString2(result_array[i].result[j].date) +
            //    " result:" + result_array[i].result[j].result +
            //    " work_begin_time:" + getDateFullString(result_array[i].result[j].work_begin_time) +
            //    " work_finish_time:" + getDateFullString(result_array[i].result[j].work_finish_time) +
            //    " pc_begin_time:" + getDateFullString(result_array[i].result[j].pc_begin_time) +
            //    " pc_finish_time:" + getDateFullString(result_array[i].result[j].pc_finish_time));
        }
    }

    const title_element = document.createElement("h2");
    title_element.innerHTML = "チェック結果";
    element_check_result.appendChild(title_element);

    for (let i = 0; i < result_array.length; i++) {
        const name_element = document.createElement("h3");
        name_element.innerHTML = result_array[i].name;
        element_check_result.appendChild(name_element);

        for (let j = 0; j < result_array[i].result.length; j++) {
            const ra = result_array[i].result[j];
            const result = (ra.result == "OK") ? "<font color='green'>OK</font>" : "<font color='red'>NG</font>";
            const div_element = document.createElement("div");
            div_element.innerHTML =
                getDateString2(ra.date) +
                "　　" + result +
                "　　freee：" + getTimeString(ra.work_begin_time) +
                "～" + getTimeString(ra.work_finish_time) +
                "　　LANSCOPE：" + getTimeString(ra.pc_begin_time) +
                "～" + getTimeString(ra.pc_finish_time) +
                "<br>";
            element_check_result.appendChild(div_element);
        }
    }

    return;
}


function OnButtonClick() {
    console.log("OnButtonClick");

    text_workhours = [];
    text_pcuptime = [];
    file_read_count_workhours = 0;
    file_read_count_pcuptime = 0;
    result_array = [];

    const element_check_result = document.getElementById('check_result');

    // 日時入力チェック
    const element_from_day = document.getElementById('fromDay');
    if (!(element_from_day.value)) {
        const message = "開始日時が入力されていません";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    from_day = element_from_day.valueAsDate;
    if (!from_day) {
        const message = "開始日時が取得できませんでした";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    from_day.setMinutes(from_day.getMinutes() + from_day.getTimezoneOffset());
    const element_to_day = document.getElementById('toDay');
    if (!(element_to_day.value)) {
        const message = "終了日時が入力されていません";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    to_day = element_to_day.valueAsDate;
    if (!to_day) {
        const message = "終了日時が取得できませんでした";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    to_day.setMinutes(to_day.getMinutes() + to_day.getTimezoneOffset());
    if (from_day >= to_day) {
        const message = "開始日時と終了日時の指定が正しくありません";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }

    const element_delta_minutes = document.getElementById('deltaMinutes');
    if (!(element_delta_minutes.value)) {
        const message = "差分許容時間が入力されていません";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    delta_minutes = parseInt(element_delta_minutes.value, 10);

    // 勤怠入力チェック
    const element_workhours = document.getElementById('workhours_directory');
    if (!(element_workhours.value)) {
        const message = "勤怠日時CSVファイルフォルダが入力されていません";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    files_workhours = element_workhours.files;
    if (!files_workhours) {
        const message = "勤怠日時CSVファイルフォルダが入力されていません２";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }

    // PCログ入力チェック
    const element_pcuptime = document.getElementById('pcuptime_directory');
    if (!(element_pcuptime.value)) {
        const message = "PCログCSVファイルフォルダが入力されていません";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }
    files_pcuptime = element_pcuptime.files;
    if (!files_pcuptime) {
        const message = "PCログCSVファイルフォルダが入力されていません２";
        console.log(message);
        element_check_result.innerHTML = message;
        return;
    }

    // 勤怠読み込み開始
    setTimeout(readFile, 1000, "workhours", files_workhours[0]);

    return;
}
