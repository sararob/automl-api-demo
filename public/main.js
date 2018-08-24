// Copyright 2018 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const forecast = {
    "altocumulus": {
        "weather": "These clouds are often spotted on warm and humid mornings. They can signal thunderstorms on the way or cold fronts."
    },
    "altostratus": {
        "weather": "You might see this clouds before a warm front, or together with cumulus clouds during a cold front."
    },
    "cirrus": {
        "weather": "Cirrus clouds can appear before warm fronts and big storms like nor'easters."
    },
    "cumulonimbus": {
        "weather": "Uh oh. There's likely severe weather approaching nearby. Cumulonimbus clouds are usually associated with short periods of heavy rainfall, hail, or even tornadoes. If you're flying today, there might be turbulence."
    },
    "cumulus": {
        "weather": "These clouds often develop on clear sunny days when the sun heats the ground directly below."
    }
}

function clearPrediction() {
    $('#img-predicted').html('');
    $('#weather-summary', '#status', '#prediction-text').text('');
    $('#card').css('display', 'none');
}

function updateProgressBar(status) {
    if (status == 'show') {
        $('#progress-bar').css('display', 'inline-block');
        $('#progress-bar').addClass('mdl-progress__indeterminate');
    } else if (status == 'hide') {
        $('#progress-bar').css('display', 'none');
    }
}

function displayPrediction(data) {
    $('#card').css('display', 'inline-block');
    $('#status').text('Got a prediction!');

    // This demo assumes only one label returned
    let cloudType = Object.keys(data)[0];
    let resultText = `${cloudType}: ${(data[cloudType] * 100).toFixed(2)}%\n`;
    $('#prediction-text').text(resultText);
    $('#weather-summary').text(forecast[cloudType].weather);
}

function displayImage(file) {
    let img = document.createElement("img");
    img.file = file;
    $('#img-predicted').append(img); 

    let reader = new FileReader();
    reader.onload = (function(imgDiv) { return function(e) { imgDiv.src = e.target.result; }; })(img);
    reader.readAsDataURL(file);
}
 
$(document).ready(() => {
    const storage = firebase.storage();
    const storageRef = storage.ref();
    const db = firebase.firestore();

    $('#file-select').on('click', () => {
        $('#cloud-upload').trigger("click");
    });

    $('#cloud-upload').on('change', (e) => {
        let localFile = e.target.files[0];
        clearPrediction();
        updateProgressBar('show');

        // Upload the image to Firebase Storage
        $('#status').text('Uploading image...');
        let imgRef = storageRef.child(localFile.name);
        imgRef.put(localFile).then(() => {
            $('#status').text('Querying model...');
            db.collection("images")
                .doc(localFile.name)
                .onSnapshot(function(doc) {
                    if (doc.exists) {
                        let cloudData = doc.data();
                        updateProgressBar('hide');
                        if (cloudData.predictionErr) {
                            $('#status').text(`${cloudData.predictionErr} :(`);
                        } else {
                            displayPrediction(cloudData);
                            displayImage(localFile);
                        }
                    }
            });
        });
    });
});