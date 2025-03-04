const queryString = window.location.search;
//    console.log(queryString);
const urlParams = new URLSearchParams(queryString);
const FirebasePath = urlParams.get("path");

console.log("firebasePath", FirebasePath);
const firebaseConfig = {
  apiKey: "AIzaSyCXxVm7oVpkuq0TPjGUs_sa4nsOTd8SmhE",
  authDomain: "dicom-admin.firebaseapp.com",
  databaseURL: "https://dicom-admin-default-rtdb.firebaseio.com",
  projectId: "dicom-admin",
  storageBucket: "dicom-admin.appspot.com",
  messagingSenderId: "43752825231",
  appId: "1:43752825231:web:6ad98d21150fd3e0f42bfa",
  measurementId: "G-EZM15EBVGQ",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// function GeneratePdf() {
// 			var element = document.getElementById('form-print');

//             // var upload2storage = html2pdf(element);;

// }

function GeneratePdf() {
  html2canvas(document.body, {
    onrendered: function (canvas) {
      var img = canvas.toDataURL("image/png");
      var doc = new jsPDF();
      doc.addImage(img, "JPEG", 20, 20);
      doc.save("test.pdf");
      var blob = doc.output("blob");
      console.log(URL.createObjectURL(blob));
      var element = document.getElementById("form-print");
      element.addEventListener("GeneratePdf", GeneratePdf);

      firebase
        .storage()
        .ref(`${FirebasePath}/Report.pdf`)
        .put(blob)
        .then((snapshot) => {
          console.log("Uploaded a blob or file!");
        });

      var uploadTask = firebase
        .storage()
        .ref()
        .child(`${FirebasePath}/Report.pdf`);

      // Listen for state changes, errors, and completion of the upload.
      uploadTask.on(
        firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
        (snapshot) => {
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          var progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
          switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
              console.log("Upload is paused");
              break;
            case firebase.storage.TaskState.RUNNING: // or 'running'
              console.log("Upload is running");
              break;
          }
        },
        (error) => {
          // A full list of error codes is available at
          // https://firebase.google.com/docs/storage/web/handle-errors
          switch (error.code) {
            case "storage/unauthorized":
              // User doesn't have permission to access the object
              break;
            case "storage/canceled":
              // User canceled the upload
              break;

            // ...

            case "storage/unknown":
              // Unknown error occurred, inspect error.serverResponse
              break;
          }
        },
        () => {
          // Upload completed successfully, now we can get the download URL
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            console.log("File available at", downloadURL);
          });
        }
      );

      firebase
        .database()
        .ref(`${FirebasePath}`)
        .update
        // {ReportURL:  }
        ();
    },
  });
}
