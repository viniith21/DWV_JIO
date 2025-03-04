function addReportTimestamp(FirebasePath, doctorName) {
  var currentDateTime = new Date();
  var formattedDateTime = formatDateTime(currentDateTime);

  firebase
    .database()
    .ref(`${FirebasePath}`)
    .update({
      Report_TimeStamp: formattedDateTime,
      Report_Addedby: doctorName,
    })
    .then(() => {
      console.log("Report_TimeStamp added successfully.");
    })
    .catch((error) => {
      console.error("Error updating Report_TimeStamp:", error);
    });
}

function formatDateTime(date) {
  var day = String(date.getDate()).padStart(2, "0");
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var year = date.getFullYear();
  var hours = String(date.getHours()).padStart(2, "0");
  var minutes = String(date.getMinutes()).padStart(2, "0");
  var seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}
