var dwvjq = dwvjq || {};
dwvjq.utils = dwvjq.utils || {};

var currentSeries = ""; // outside the function, near the top

/**
 * Application GUI.
 */

// Default colour maps.
dwv.luts = {
  plain: dwv.luts.plain,
  invPlain: dwv.luts.invPlain,
  rainbow: dwv.luts.rainbow,
  hot: dwv.luts.hot,
  hot_iron: dwv.luts.hot_iron,
  pet: dwv.luts.pet,
  hot_metal_blue: dwv.luts.hot_metal_blue,
  pet_20step: dwv.luts.pet_20step,
};

// Default window level presets.
dwv.defaultpresets = {};
// Default window level presets for CT.
dwv.defaultpresets.CT = {
  mediastinum: { center: 40, width: 400 },
  lung: { center: -500, width: 1500 },
  bone: { center: 500, width: 2000 },
  brain: { center: 40, width: 80 },
  head: { center: 90, width: 350 },
};

// decode query
dwvjq.utils.loadFromUri = function (uri, app) {
  var url = new URL(uri);
  var searchParams = url.searchParams;
  // check query
  var input = searchParams.get("input");
  if (input) {
    var type = searchParams.get("type");
    // special gdrive
    if (type) {
      var gAuth = new dwvjq.google.Auth();
      var gDrive = new dwvjq.google.Drive();
      gDrive.setIds(input.split(","));
      // pipeline
      gAuth.onload = gDrive.load;
      gAuth.onfail = function () {
        $("#popupAuth").popup("open");
        var authorizeButton = document.getElementById("gauth-button");
        // explicit auth from button to allow popup
        authorizeButton.onclick = function () {
          $("#popupAuth").popup("close");
          gAuth.load();
        };
      };
      gDrive.onload = dwvjq.google.getAuthorizedCallback(app.loadURLs);
      // launch with silent auth
      gAuth.loadSilent();
    } else {
      // default
      app.loadFromUri(uri);
    }
  }
};

// special close dialog on change
dwvjq.gui.FileLoad.prototype.onchange = function (/*event*/) {
  $("#popupOpen").popup("close");
};
dwvjq.gui.FolderLoad.prototype.onchange = function (/*event*/) {
  $("#popupOpen").popup("close");
};
dwvjq.gui.UrlLoad.prototype.onchange = function (/*event*/) {
  $("#popupOpen").popup("close");
};

// Toolbox
dwvjq.gui.ToolboxContainer = function (app, infoController) {
  var base = new dwvjq.gui.Toolbox(app);

  this.setup = function (list) {
    base.setup(list);

    // toolbar
    var buttonClass = "ui-btn ui-btn-inline ui-btn-icon-notext ui-mini";

    var open = document.createElement("a");
    open.href = "#popupOpen";
    open.setAttribute("class", buttonClass + " ui-icon-plus");
    open.setAttribute("data-rel", "popup");
    open.setAttribute("data-position-to", "window");
    open.setAttribute("title", "Open File"); // Tooltip

    var undo = document.createElement("a");
    undo.setAttribute("class", buttonClass + " ui-icon-back");
    undo.setAttribute("title", "Undo"); // Tooltip
    undo.onclick = function (/*event*/) {
      app.undo();
    };

    var redo = document.createElement("a");
    redo.setAttribute("class", buttonClass + " ui-icon-forward");
    redo.setAttribute("title", "Redo"); // Tooltip
    redo.onclick = function (/*event*/) {
      app.redo();
    };

    var toggleInfo = document.createElement("a");
    toggleInfo.setAttribute("class", buttonClass + " ui-icon-info");
    toggleInfo.setAttribute("title", "Toggle Info"); // Tooltip
    toggleInfo.onclick = function () {
      var infoLayer = document.getElementById("infoLayer");
      dwvjq.html.toggleDisplay(infoLayer);
      infoController.toggleListeners();
    };

    // var toggleSaveState = document.createElement("a");
    // toggleSaveState.setAttribute(
    //   "class",
    //   buttonClass + " download-state ui-icon-action"
    // );
    // toggleSaveState.setAttribute("title", "Save Annotations"); // Tooltip

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const urlPath = urlParams.get("Patient");
    const FirebasePath = urlPath.replace(/\/folder_.*$/, "");
    const AnnotationPath = `${FirebasePath.replace(/[/]+$/, "")}/Annotations`;
    let currentSeries = "";

    // toggleSaveState.onclick = function () {
    //   if (currentSeries) {
    //     var stateJson = app.getJsonState();
    //     var database = window.firebaseApp.database();
    //     var seriesAnnotationPath = `${AnnotationPath}/${currentSeries}/AnnotationJson`;

    //     database
    //       .ref(seriesAnnotationPath)
    //       .set(stateJson)
    //       .then(() => {
    //         alert("Annotation is saved for " + currentSeries);
    //         console.log(
    //           "State saved to Firebase Realtime Database for series:",
    //           currentSeries
    //         );
    //       })
    //       .catch((error) => {
    //         console.error("Error saving state:", error);
    //       });
    //   } else {
    //     alert("Please select a series to save annotations.");
    //   }
    // };

    // Function to set the current series being viewed

    //

    /* button creation for annotation*/
    var toggleSaveState = document.createElement("a");
    toggleSaveState.setAttribute(
      "class",
      buttonClass + " download-state ui-icon-action"
    );
    toggleSaveState.setAttribute("title", "Save Annotation"); // Tooltip

    /* function for annotation*/
    // toggleSaveState.onclick = function () {
    //   // 1) Retrieve the annotationGroup and dataId from the app
    //   var dataIds = app.getDataIds();
    //   var annotationGroup;
    //   var dataId;

    //   for (var j = 0; j < dataIds.length; ++j) {
    //     var ag = app.getData(dataIds[j]).annotationGroup;
    //     if (typeof ag !== "undefined") {
    //       annotationGroup = ag;
    //       dataId = dataIds[j];
    //       break; // Found it; break out
    //     }
    //   }
    //   if (!annotationGroup) {
    //     alert("No annotations found.");
    //     return;
    //   }

    //   // 2) Convert annotation to DICOM SR
    //   var factory = new dwv.AnnotationGroupFactory();
    //   var dicomElements = factory.toDicom(annotationGroup);

    //   // 3) Write to buffer
    //   var writer = new dwv.DicomWriter();
    //   let dicomBuffer = null;
    //   try {
    //     dicomBuffer = writer.getBuffer(dicomElements);
    //   } catch (error) {
    //     console.error(error);
    //     alert(error.message);
    //     return;
    //   }

    //   // 4) Create a Blob and trigger the download
    //   var blob = new Blob([dicomBuffer], { type: "application/dicom" });
    //   var element = document.createElement("a");
    //   element.href = window.URL.createObjectURL(blob);
    //   element.download = "dicom-sr-" + dataId + ".dcm";
    //   element.click();
    //   URL.revokeObjectURL(element.href);
    // };

    toggleSaveState.onclick = function () {
      // 1) Retrieve the annotationGroup and dataId from the app
      var dataIds = app.getDataIds();
      var annotationGroup;
      var dataId;

      for (var j = 0; j < dataIds.length; ++j) {
        var ag = app.getData(dataIds[j]).annotationGroup;
        if (typeof ag !== "undefined") {
          annotationGroup = ag;
          dataId = dataIds[j];
          break; // Found it; break out
        }
      }
      if (!annotationGroup) {
        alert("No annotations found.");
        return;
      }

      // 2) Convert annotation to DICOM SR
      var factory = new dwv.AnnotationGroupFactory();
      var dicomElements = factory.toDicom(annotationGroup);

      // 3) Write to buffer
      var writer = new dwv.DicomWriter();
      let dicomBuffer = null;
      try {
        dicomBuffer = writer.getBuffer(dicomElements);
      } catch (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      // 4) Create a Blob from that buffer
      var blob = new Blob([dicomBuffer], { type: "application/dicom" });

      // ========== FIREBASE STORAGE UPLOAD CODE ==========
      if (!currentSeries) {
        alert("No series selected. Cannot save SR file.");
        return;
      }

      // Grab the top-level "Patient" path from URL
      const urlParams = new URLSearchParams(window.location.search);
      let urlPath = urlParams.get("Patient");

      // Remove any trailing slashes from the URL path
      urlPath = urlPath.replace(/\/+$/, "");

      // Clean the currentSeries string:
      // If the first segment starts with "folder_", remove it (when there are multiple segments).
      let segments = currentSeries.split("/");
      if (segments.length > 1 && segments[0].startsWith("folder_")) {
        segments.shift();
      }
      const cleanedSeries = segments.join("/");

      // Determine the storage path based on the following logic:
      // - If the URL's last segment starts with "folder_" AND
      //   the cleanedSeries consists of a single segment that also starts with "folder_",
      //   then ignore the cleanedSeries.
      // - Otherwise, include the cleanedSeries in the storage path.
      const urlPathSegments = urlPath.split("/");
      const urlLastSegment = urlPathSegments[urlPathSegments.length - 1];
      const cleanedSeriesSegments = cleanedSeries.split("/");

      let storagePath;
      if (
        urlLastSegment.startsWith("folder_") &&
        cleanedSeriesSegments.length === 1 &&
        cleanedSeries.startsWith("folder_")
      ) {
        // Ignore cleanedSeries
        storagePath = `${urlPath}/dicom-sr-${dataId}.dcm`;
      } else {
        // Include cleanedSeries
        storagePath = `${urlPath}/${cleanedSeries}/dicom-sr-${dataId}.dcm`;
      }

      console.log("URL path:", urlPath);
      console.log("Cleaned series:", cleanedSeries);
      console.log("Final storage path:", storagePath);

      // Now do the upload:
      const storageRef = firebaseApp.storage().ref();
      const fileRef = storageRef.child(storagePath);

      fileRef
        .put(blob)
        .then((snapshot) => {
          alert(
            `Annotation SR saved to Firebase Storage under:\n${storagePath}`
          );
          console.log("Snapshot metadata:", snapshot.metadata);
        })
        .catch((error) => {
          console.error("Error uploading SR:", error);
          alert("Error uploading SR: " + error.message);
        });

      // ========== (OPTIONAL) If you still want local download, do it here ==========
      /*
  var element = document.createElement("a");
  element.href = window.URL.createObjectURL(blob);
  element.download = "dicom-sr-" + dataId + ".dcm";
  element.click();
  URL.revokeObjectURL(element.href);
  */
    };

    this.setCurrentSeries = function (series) {
      currentSeries = series;
      console.log("Current series set to:", currentSeries);
    };

    var tags = document.createElement("a");
    tags.href = "#tags_page";
    tags.setAttribute("class", buttonClass + " ui-icon-grid");
    tags.setAttribute("title", "Tags"); // Tooltip

    var drawList = document.createElement("a");
    drawList.href = "#drawList_page";
    drawList.setAttribute("class", buttonClass + " ui-icon-bullets");
    drawList.setAttribute("title", "Annotation List"); // Tooltip

    var node = document.getElementById("dwv-toolbar");
    node.style.display = "flex";
    // node.appendChild(open);
    node.appendChild(undo);
    node.appendChild(redo);
    // node.appendChild(toggleInfo);
    node.appendChild(toggleSaveState);
    // node.appendChild(tags);
    node.appendChild(drawList);

    // Apply hover effects
    addHoverEffects([
      open,
      undo,
      redo,
      toggleInfo,
      toggleSaveState,
      tags,
      drawList,
    ]);

    dwvjq.gui.refreshElement(node);
  };

  this.display = function (flag) {
    base.display(flag);
  };
  this.initialise = function () {
    base.initialise();
  };

  // Function to apply hover effects to buttons
  function addHoverEffects(buttons) {
    buttons.forEach(function (button) {
      button.onmouseover = function () {
        button.style.transform = "scale(1.1)";
        button.style.transition = "transform 0.2s";
        button.style.filter = "brightness(1.2)";
      };
      button.onmouseout = function () {
        button.style.transform = "scale(1)";
        button.style.filter = "brightness(1)";
      };
    });
  }
};
