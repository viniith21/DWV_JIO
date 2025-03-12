/* eslint-disable */

// namespaces
var dwvjq = dwvjq || {};

var viewOnFirstLoadItem = true;
var isComparisonOpen = false; // Tracks whether comparison mode is active
var myapp, myapp2;
let isSidebarVisible = true; // Tracks sidebar visibility
let isMprActive = false; // Tracks MPR state
var srURLs = [];
function incrementViewCount(instituteName, doctorName, patientName) {
  const viewCountRef = firebase
    .database()
    .ref(`superadmin/admins/${instituteName}/costing`);

  // Use a promise to handle the asynchronous transaction
  return viewCountRef.transaction((currentData) => {
    const newTimestamp = new Date();
    const monthYearKey = newTimestamp.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });

    if (!currentData) {
      currentData = {
        totalViews: 1,
        last_Viewed_Events: {},
      };
    }

    if (!currentData.last_Viewed_Events) {
      currentData.last_Viewed_Events = {};
    }

    currentData.totalViews = (currentData.totalViews || 0) + 1;

    if (!currentData.last_Viewed_Events[monthYearKey]) {
      currentData.last_Viewed_Events[monthYearKey] = [];
    }

    currentData.last_Viewed_Events[monthYearKey].push({
      doctor: doctorName,
      patient: patientName,
      timestamp: newTimestamp.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });

    return currentData;
  });
}

// Function to analyze view events
function analyzeViewEvents(currentData) {
  if (currentData && currentData.last_Viewed_Events) {
    Object.keys(currentData.last_Viewed_Events).forEach((monthYearKey) => {
      currentData.last_Viewed_Events[monthYearKey].forEach((event) => {
        const doctor = event.doctor;
        const patient = event.patient;
        const timestamp = event.timestamp;
      });
    });
  } else {
    console.log("No view events recorded yet.");
  }
}

// Initialize the application
function startApp() {
  /**
   * Fetch a remote ZIP file containing .dcm files, unzip them, and load into DWV.
   *
   * @param {string} zipUrl - The URL of the ZIP file (e.g. from ?data=...).
   * @param {dwv.App} dwvApp - Your DWV app instance (e.g. myapp).
   */
  async function loadDicomFromRemoteZip(zipUrl, dwvApp) {
    try {
      console.log("Fetching and loading ZIP from:", zipUrl);

      const response = await fetch(zipUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch ZIP: " + response.status);
      }
      const arrayBuffer = await response.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Group DICOM files by series. We assume that the series are determined
      // by the folder structure in the zip file. If no folder exists,
      // all files are put into a default series.
      const seriesMap = {};

      const zipEntries = Object.keys(zip.files);
      for (const entryName of zipEntries) {
        if (entryName.toLowerCase().endsWith(".dcm")) {
          // Determine series key: use folder name if available, else default.
          let seriesKey = "default_series";
          if (entryName.includes("/")) {
            // Get the folder part (everything before the last '/')
            seriesKey = entryName.substring(0, entryName.lastIndexOf("/"));
          }
          // Create array for series if it doesn't exist
          if (!seriesMap[seriesKey]) {
            seriesMap[seriesKey] = [];
          }
          const fileData = await zip.files[entryName].async("arraybuffer");
          const file = new File([fileData], entryName, {
            type: "application/dicom",
            lastModified: Date.now(),
          });
          // Create an object URL for the file
          const blobUrl = URL.createObjectURL(file);
          seriesMap[seriesKey].push(blobUrl);
        }
      }

      if (Object.keys(seriesMap).length === 0) {
        alert("No .dcm files found in the provided ZIP.");
        return;
      }

      // Initialize the folder selection interface
      initializeFolderSelectionInterface();

      // Iterate over each series and load it.
      for (const seriesKey in seriesMap) {
        const blobUrls = seriesMap[seriesKey];
        // Load the first series into the main viewer.
        // You can decide whether to load the first one immediately or all in a loop.
        // In this example, we load each series into the sidebar for selection.
        addSeriesToFolderSelectionInterface(seriesKey, blobUrls);
        // Optionally, you could auto-load the first series:
        // if (/* condition for first series, e.g. not already loaded */) {
        //   dwvApp.loadURLs(blobUrls);
        // }
      }

      // Optionally, you might want to auto-load the first series by default:
      const firstSeriesKey = Object.keys(seriesMap)[0];
      console.log("Auto-loading first series:", firstSeriesKey);
      dwvApp.loadURLs(seriesMap[firstSeriesKey]);
    } catch (err) {
      console.error("Error loading ZIP:", err);
      alert("Error loading ZIP: " + err.message);
    }
  }

  // logger
  dwv.logger.level = dwv.logger.levels.WARN;

  // translate page
  dwvjq.i18n.translatePage();

  // show dwv version
  dwvjq.gui.appendVersionHtml("0.8.0-beta");

  // [ZIP Support Addition #1]: Check ?data= param near the end of startApp

  var url;

  // application options
  var filterList = ["Threshold", "Sharpen", "Sobel"];
  var shapeList = [
    "Arrow",
    "Ruler",
    "Protractor",
    "Rectangle",
    "Roi",
    "Ellipse",
    "Circle",
    "FreeHand",
  ];

  window.toolList = {
    Scroll: {},
    Opacity: {},
    WindowLevel: {},
    ZoomAndPan: {},
    Draw: {
      options: shapeList,
    },
    Livewire: {},
    Filter: {
      options: filterList,
    },
    Floodfill: {},
  };

  var options = {
    tools: toolList,
    viewOnFirstLoadItem: viewOnFirstLoadItem,
  };

  const viewConfig0 = new dwv.ViewConfig("layerGroup0");

  viewConfig0.orientation = "";
  const viewConfigs = { "*": [viewConfig0] };

  // Initialize the first app instance
  myapp = new dwv.App();
  myapp.init(options);
  myapp.setDataViewConfigs(viewConfigs);

  myapp.getToolboxController().setSelectedTool("Scroll");

  const urlParamss = new URLSearchParams(window.location.search);
  const zipParam = urlParamss.get("data"); // e.g. ?data=someDicomZip.zip
  if (zipParam) {
    // If param ends with .zip, do special load
    if (zipParam.toLowerCase().endsWith(".zip")) {
      console.log("Detected ZIP in ?data= param:", zipParam);
      // We'll define this function below
      loadDicomFromRemoteZip(zipParam, myapp);
    } else {
      // If not a zip, you might want to load directly (optional)
      // e.g., myapp.loadURLs([ zipParam ]);
      console.log("Non-zip ?data= param. Doing direct load:", zipParam);
      myapp.loadURLs([zipParam]);
    }
  } else {
    console.log("No ?data= ZIP param found. Proceeding with existing logic.");
    // If you have other existing logic that calls loadFromUri(...), keep it here.
    // For example:
    dwvjq.utils.loadFromUri(window.location.href, myapp);
  }

  // Make layer groups droppable targets now that they exist

  function makeLayerGroupsDroppable() {
    const dropTargets = ["layerGroup0", "layerGroup1", "layerGroup2"];
    dropTargets.forEach((id) => {
      const target = document.getElementById(id);
      if (target) {
        target.addEventListener("dragover", (e) => {
          // console.log('dragover on', id);
          e.preventDefault();
        });
        target.addEventListener("drop", (e) => {
          // console.log('drop on', id);
          e.preventDefault();
          console.log("DROP event triggered on:", id);
          const data = e.dataTransfer.getData("text/plain");
          if (data) {
            const { seriesName, seriesUrls } = JSON.parse(data);
            console.log("Calling loadFolderContents for series:", seriesName);
            loadFolderContents(seriesUrls, seriesName, id);
          }
        });
      }
    });
  }

  makeLayerGroupsDroppable();

  function getPrecisionRound(precision) {
    return function (x) {
      return dwv.precisionRound(x, precision);
    };
  }

  // Global variable to track sidebar visibility
  let isSidebarVisible = true;

  // Function to hide sidebar on MPR view
  function toggleSidebar(forceState = null) {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    if (forceState !== null) {
      isSidebarVisible = forceState;
      if (isSidebarVisible) {
        sidebar.classList.remove("hidden");
      } else {
        sidebar.classList.add("hidden");
      }
    } else {
      sidebar.classList.toggle("hidden");
      isSidebarVisible = !isSidebarVisible;
    }
  }

  // Event listener to hide sidebar on MPR view
  document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("hamburgerButton");

    // Toggle sidebar on button click
    toggleButton.addEventListener("click", function () {
      toggleSidebar(); // Use the toggle function
    });
  });

  // Event listener for crosshair lines in mpr view
  document.addEventListener("positionchange", function (event) {
    const input = document.getElementById("position");
    const values = event.value[1];
    let text = "(index: " + event.value[0] + ")";
    if (event.value.length > 2) {
      text += " value: " + event.value[2];
    }
    input.value = values.map(getPrecisionRound(2));
    // index as small text
    const span = document.getElementById("positionspan");
    if (span) {
      span.innerHTML = text;
    }
  });

  // Event listeners for MPR
  document.addEventListener("mprOpenViews", function () {
    if ((isComparisonOpen = true)) {
      document.dispatchEvent(new Event("comparisonCloseViews"));
    }
    console.log("Comparison in MPR", isComparisonOpen);
    isMprActive = true; // MPR is active
    toggleSidebar(false); // Force hide the sidebar

    // Define MPR-related view configs here

    const viewConfig1 = new dwv.ViewConfig("layerGroup1");
    viewConfig1.orientation = "coronal";
    viewConfig1.fitToWindow = true;
    const viewConfig2 = new dwv.ViewConfig("layerGroup2");
    viewConfig2.orientation = "sagittal";
    viewConfig2.fitToWindow = true;

    const viewConfigs = { "*": [viewConfig0, viewConfig1, viewConfig2] };

    // Save the MPR configuration globally.
    window.mprViewConfigs = viewConfigs;

    const lg = document.getElementsByClassName("layerGroup");
    for (let i = 0; i < lg.length; i++) {
      lg[i].style.marginTop = "0px";
    }

    // Adjust CSS for MPR layout:
    // Left panel: layerGroup0 occupies 50%
    const lg0 = document.getElementById("layerGroup0");
    lg0.style.width = "50%";
    // lg0.style.display = "inline-block";
    lg0.style.verticalAlign = "top";

    // Right panel: show it and set it to 50% width
    const rightPanel = document.getElementById("right-panel");
    rightPanel.style.display = "inline-block";
    rightPanel.style.width = "50%";
    rightPanel.style.verticalAlign = "top";
    rightPanel.style.height = "92vh"; // or match your viewer height
    rightPanel.style.position = "relative";
    rightPanel.style.overflow = "hidden";

    // layerGroup1 and layerGroup2 each take 50% height of right panel
    const lg1 = document.getElementById("layerGroup1");
    lg1.style.width = "100%";
    lg1.style.height = "50%";
    lg1.style.boxSizing = "border-box";
    lg1.style.display = "block";

    const lg2 = document.getElementById("layerGroup2");
    lg2.style.width = "100%";
    lg2.style.height = "50%";
    lg2.style.boxSizing = "border-box";
    lg2.style.display = "block";

    // Switch off viewOnFirstLoadItem since we want full loading
    options.viewOnFirstLoadItem = false;

    // Reset and reinitialize with multi-view configs
    myapp.reset();
    myapp.init(options);
    myapp.setDataViewConfigs(viewConfigs);
    // myapp.onResize();

    // myapp.setLayerGroupsBinders(['PositionBinder', 'WindowLevelBinder', 'ZoomBinder', 'OffsetBinder', 'OpacityBinder', 'ColourMapBinder']);
    // Ensure the Position binder is enabled automatically
    const binders = [
      "PositionBinder",
      "WindowLevelBinder",
      "ZoomBinder",
      "OffsetBinder",
      "OpacityBinder",
      "ColourMapBinder",
    ];
    myapp.setLayerGroupsBinders(binders);

    function onLoadEndMPR(event) {
      // Just call render without arguments
      myapp.onResize();
      myapp.render(event.dataid);
      myapp.removeEventListener("loadend", onLoadEndMPR);
    }

    myapp.addEventListener("load", onLoadEndMPR);

    // Renderend callback: Once rendering is done, layers are ready and we can show the crosshair.
    function onRenderEndMPR() {
      myapp.getLayerGroupByDivId("layerGroup0").setShowCrosshair(true);
      myapp.getLayerGroupByDivId("layerGroup1").setShowCrosshair(true);
      myapp.getLayerGroupByDivId("layerGroup2").setShowCrosshair(true);

      myapp.removeEventListener("load", onRenderEndMPR);
    }

    myapp.addEventListener("load", onRenderEndMPR);
    myapp.addEventListener("loadend", function onLoadEndSR() {
      myapp.removeEventListener("loadend", onLoadEndSR);
      if (srURLs.length > 0) {
        console.log("Loading SR annotations in MPR mode...", srURLs);
        myapp.loadURLs(srURLs);
      } else {
        console.log("No SR annotations found.");
      }
    });

    if (url && url.length) {
      myapp.loadURLs(url);
    }

    myapp.getToolboxController().setSelectedTool("Scroll");
  });

  document.addEventListener("mprCloseViews", function () {
    console.log("Closing MPR views comprisonOpen:", isComparisonOpen);
    isMprActive = false; // MPR is inactive
    toggleSidebar(true); // Force show the sidebar

    // Revert to single-view mode
    const viewConfigs = { "*": [viewConfig0] };

    const lg = document.getElementsByClassName("layerGroup");
    for (let i = 0; i < lg.length; i++) {
      lg[i].style.marginTop = "-0.8%";
    }

    // Hide extra views
    const lg0 = document.getElementById("layerGroup0");
    lg0.style.width = "100%";

    const rightPanel = document.getElementById("right-panel");
    rightPanel.style.display = "none"; // Hide right panel entirely
    rightPanel.style.width = "0%";

    const lg1 = document.getElementById("layerGroup1");
    lg1.style.width = "0%";
    lg1.style.height = "";
    lg1.style.display = "none";

    const lg2 = document.getElementById("layerGroup2");
    lg2.style.width = "0%";
    lg2.style.height = "";
    lg2.style.display = "none";

    // Revert viewOnFirstLoadItem to true for normal loading
    options.viewOnFirstLoadItem = true;

    // Reset and reinitialize with single-view configs
    myapp.reset();
    myapp.init(options);
    myapp.setDataViewConfigs(viewConfigs);

    // myapp.setLayerGroupsBinders(['PositionBinder', 'WindowLevelBinder', 'ZoomBinder', 'OffsetBinder', 'OpacityBinder', 'ColourMapBinder']);

    // Reload URLs if needed

    myapp.loadURLs(url);

    myapp.getToolboxController().setSelectedTool("Scroll");
  });

  // Define some global configs for convenience:
  var singleViewConfigs0 = { "*": [new dwv.ViewConfig("layerGroup0")] };
  var comparisonViewConfig0 = new dwv.ViewConfig("layerGroup0");
  comparisonViewConfig0.orientation = ""; // or as required
  var comparisonViewConfig1 = new dwv.ViewConfig("layerGroup1");
  comparisonViewConfig1.orientation = ""; // or as required

  var comparisonConfigs0 = { "*": [comparisonViewConfig0] };
  var comparisonConfigs1 = { "*": [comparisonViewConfig1] };

  // Event listeners for comparison open and close views
  // On comparison mode open:
  document.addEventListener("comparisonOpenViews", function () {
    document.getElementById("infoLayer").style.display = "none";
    isComparisonOpen = true;

    // Adjust layout CSS for comparison mode
    // Show the sidebar if needed or adjust according to your UI needs
    const marginLeft0 = "115px"; // Adjust based on sidebar width
    const marginLeft1 = "10px";

    const layerGroup0 = document.getElementById("layerGroup0");
    const layerGroup1 = document.getElementById("layerGroup1");
    const rightPanel = document.getElementById("right-panel");
    const layerGroup2 = document.getElementById("layerGroup2");

    // Ensure MPR is not active since both modes are not meant to coexist
    if (isMprActive) {
      // If MPR is active, either close it before opening comparison or
      // directly close it here.
      const closeMprEvent = new CustomEvent("mprCloseViews");
      document.dispatchEvent(closeMprEvent);
    }

    // Set up the layout for comparison:
    // Left side: layerGroup0 at 50%
    layerGroup0.style.width = "50%";
    layerGroup0.style.marginLeft = marginLeft0;
    // layerGroup0.style.display = "inline-block";
    layerGroup0.style.verticalAlign = "top";

    // Right side: show right-panel at 50%
    rightPanel.style.display = "inline-block";
    rightPanel.style.width = "48%";
    rightPanel.style.verticalAlign = "top";
    rightPanel.style.height = "100%";
    rightPanel.style.position = "relative";
    rightPanel.style.marginTop = "-6px";
    //rightPanel.style.overflow = "hidden";

    // For comparison mode, layerGroup1 should fill the right-panel,
    // layerGroup2 should remain hidden.
    layerGroup1.style.display = "block";
    layerGroup1.style.width = "100%";
    layerGroup1.style.height = "100%";
    layerGroup1.style.marginLeft = marginLeft1;
    layerGroup2.style.display = "none"; // Hide layerGroup2 entirely

    // Initialize or re-initialize myapp2 for comparison mode
    if (!window.myapp2) {
      window.myapp2 = new dwv.App();
    } else {
      myapp2.reset();
    }
    myapp2.init(options);
    myapp2.setDataViewConfigs(comparisonConfigs1);
    myapp2.getToolboxController().setSelectedTool("Scroll");
  });

  // On comparison mode close:
  document.addEventListener("comparisonCloseViews", function () {
    isComparisonOpen = false; // Disable comparison mode

    const layerGroup0 = document.getElementById("layerGroup0");
    const layerGroup1 = document.getElementById("layerGroup1");
    const rightPanel = document.getElementById("right-panel");
    const layerGroup2 = document.getElementById("layerGroup2");

    // Restore single view layout
    layerGroup0.style.width = "100%";
    layerGroup0.style.marginLeft = "0";
    // layerGroup0.style.display = "inline-block";
    // Hide right-panel again for single view mode
    rightPanel.style.display = "none";
    rightPanel.style.width = "0%";

    layerGroup1.style.display = "none";
    layerGroup1.style.width = "0%";
    layerGroup1.style.marginLeft = "0";

    // Reset layerGroup2 if needed
    layerGroup2.style.display = "none";
    layerGroup2.style.width = "0%";
    layerGroup2.style.height = "";

    // Dispose of myapp2
    if (myapp2) {
      myapp2.reset();
      myapp2 = null;
    }

    // Re-init myapp in single view mode
    myapp.reset();
    myapp.init(options);
    myapp.setDataViewConfigs(singleViewConfigs0);

    // Reload URLs if they were loaded previously
    if (url && url.length) {
      myapp.loadURLs(url);
    }

    myapp.getToolboxController().setSelectedTool("Scroll");
  });

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  // Get client InstituteName from URL parameters
  const instituteName = urlParams.get("InstituteName");
  const doctorName = urlParams.get("DoctorName");
  const patientName = urlParams.get("PatientName");

  // Check if instituteName is present before incrementing view count
  if (instituteName && !sessionStorage.getItem("viewCountIncremented")) {
    incrementViewCount(instituteName, doctorName, patientName)
      .then((transactionResult) => {
        if (transactionResult.committed) {
          console.log("View count incremented successfully.");
          sessionStorage.setItem("viewCountIncremented", "true");
          analyzeViewEvents(transactionResult.snapshot.val());
        } else {
          console.log("Transaction was not committed.");
        }
      })
      .catch((error) => {
        console.error("Error incrementing view count:", error);
      });
  } else {
    console.log(
      "No instituteName present or view count already incremented in this session."
    );
  }

  // show help
  var isMobile = true;
  dwvjq.gui.appendHelpHtml(
    myapp.getToolboxController().getToolList(),
    isMobile,
    myapp,
    "resources/help"
  );

  // setup the undo gui
  var undoGui = new dwvjq.gui.Undo(myapp);
  undoGui.setup();

  // setup the dropbox loader
  var dropBoxLoader = new dwvjq.gui.DropboxLoader(myapp);
  dropBoxLoader.init();

  // setup the loadbox gui
  var loadboxGui = new dwvjq.gui.Loadbox(myapp);
  var loaderList = ["File", "Url", "GoogleDrive", "Dropbox"];
  if (dwvjq.browser.hasInputDirectory()) {
    loaderList.splice(1, 0, "Folder");
  }
  loadboxGui.setup(loaderList);

  // info layer
  var infoDataId = "0";
  var infoController = new dwvjq.gui.info.Controller(myapp, infoDataId);
  infoController.init();

  var infoElement = document.getElementById("infoLayer");
  var infoOverlay = new dwvjq.gui.info.Overlay(infoElement);

  // setup the tool gui
  var toolboxGui = new dwvjq.gui.ToolboxContainer(myapp, infoController);
  toolboxGui.setup(toolList);

  // setup the meta data gui
  var metaDataGui = new dwvjq.gui.MetaData(myapp);

  // setup the draw list gui
  var drawListGui = new dwvjq.gui.DrawList(myapp);
  drawListGui.init();

  // abort shortcut listener
  var abortOnCrtlX = function (event) {
    if (event.ctrlKey && event.keyCode === 88) {
      console.log("Abort load received from user (crtl-x).");
      myapp.abortLoad();
    }
  };

  // handle load events
  var nLoadItem = null;
  var nReceivedLoadError = null;
  var nReceivedLoadAbort = null;
  myapp.addEventListener("loadstart", function (event) {
    nLoadItem = 0;
    nReceivedLoadError = 0;
    nReceivedLoadAbort = 0;
    dropBoxLoader.showDropbox(false);
    dwvjq.gui.displayProgress(0);
    if (event.loadtype === "image" && event.dataid === infoDataId) {
      infoController.reset();
    }
    window.addEventListener("keydown", abortOnCrtlX);
  });
  myapp.addEventListener("loadprogress", function (event) {
    var percent = Math.ceil((event.loaded / event.total) * 100);
    dwvjq.gui.displayProgress(percent);
  });
  myapp.addEventListener("loaditem", function (event) {
    ++nLoadItem;
    if (event.loadtype === "image") {
      infoController.onLoadItem(event);
    }
  });

  var initInfoController = function () {
    infoController.addEventListener("valuechange", infoOverlay.onDataChange);
    myapp.removeEventListener("renderstart", initInfoController);
  };
  myapp.addEventListener("renderstart", initInfoController);
  // init toolbox gui at first render end
  var initToolboxGui = function () {
    toolboxGui.initialise();
    toolboxGui.display(true);
    myapp.removeEventListener("renderend", initToolboxGui);
  };
  myapp.addEventListener("renderend", initToolboxGui);

  myapp.addEventListener("load", function (event) {
    // only initialise at first data
    if (event.dataid === infoDataId) {
      // initialise undo gui
      undoGui.setup();
      // update meta data table
      metaDataGui.update(myapp.getMetaData("0"));
    }
  });

  // myapp.addEventListener("error", function (event) {
  //   console.error("load error", event);
  //   ++nReceivedLoadError;
  // });
  myapp.addEventListener("abort", function (/*event*/) {
    ++nReceivedLoadAbort;
  });
  myapp.addEventListener("loadend", function (/*event*/) {
    if (nReceivedLoadError) {
      var message = "A load error has ";
      if (nReceivedLoadError > 1) {
        message = nReceivedLoadError + " load errors have ";
      }
      message += "occurred. See log for details.";
      alert(message);
      if (!nLoadItem) {
        dropBoxLoader.showDropbox(true);
      }
    }
    if (nReceivedLoadAbort !== 0) {
      console.warn("Data load was aborted.");
      dropBoxLoader.showDropbox(true);
    }
    window.removeEventListener("keydown", abortOnCrtlX);
    dwvjq.gui.displayProgress(100);
  });

  // handle undo/redo
  myapp.addEventListener("undoadd", function (event) {
    undoGui.addCommandToUndoHtml(event.command);
  });
  myapp.addEventListener("undo", function (/*event*/) {
    undoGui.enableLastInUndoHtml(false);
  });
  myapp.addEventListener("redo", function (/*event*/) {
    undoGui.enableLastInUndoHtml(true);
  });

  // handle key events
  myapp.addEventListener("keydown", function (event) {
    myapp.defaultOnKeydown(event);
  });

  // handle window resize
  window.addEventListener("resize", function () {
    myapp.onResize();
    // if (comparisonEnabled) {
    //   myapp.onResize();
    // }
  });

  // possible load from location
  dwvjq.utils.loadFromUri(window.location.href, myapp);

  const urlPath = urlParams.get("Patient");
  const AnnotationPath = urlPath.replace(/\/folder_.*$/, "");
  const FirebasePath = urlPath.replace(/[/]+$/, "");

  const dbRef = firebase.database().ref(AnnotationPath + "/AnnotationJson");

  function checkVersionAndRenderDICOM(annotationPath) {
    const patientRef = firebase.database().ref(annotationPath);

    patientRef
      .once("value")
      .then(function (snapshot) {
        const patientData = snapshot.val();
        const version = patientData.Version;

        if (version === "02" || version === "03") {
          fetchAndRenderNewStructure();
        } else {
          fetchAndRenderOldStructure();
        }
      })
      .catch(function (error) {
        console.error("Error fetching patient version:", error);
      });
    fetchAndRenderAWSStructure();
  }

  // Global flag so that the first valid series is loaded only once.
  let firstSeriesLoaded = false;

  /**
   * Recursively fetch all DICOM URLs in a folder.
   *
   * @param {firebase.storage.Reference} folderRef - The Firebase storage folder reference.
   * @param {Object} seriesUrls - Accumulator for series URLs.
   * @returns {Promise<Object>} - A mapping of folder names to an array of DICOM URLs.
   */
  async function fetchAllSeriesUrlsRecursively(folderRef, seriesUrls = {}) {
    const { items, prefixes } = await folderRef.listAll();

    if (items.length > 0) {
      const urls = await Promise.all(
        items.map((item) => item.getDownloadURL())
      );
      seriesUrls[folderRef.name] = urls;
    }

    for (const prefix of prefixes) {
      await fetchAllSeriesUrlsRecursively(prefix, seriesUrls);
    }

    return seriesUrls;
  }

  /**
   * Generate a thumbnail image from a DICOM URL.
   *
   * @param {string} url - The URL of the DICOM image.
   * @returns {Promise<string>} - A promise that resolves with a data URL for the thumbnail.
   */
  function generateThumbnailFromDICOM(url) {
    return new Promise((resolve, reject) => {
      // Create a temporary div.
      const tempDiv = document.createElement("div");
      tempDiv.style.visibility = "hidden";
      tempDiv.style.width = "512px";
      tempDiv.style.height = "512px";
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-10000px";
      tempDiv.id = "tempDiv_" + Math.random().toString(36).substring(2);
      document.body.appendChild(tempDiv);

      // Create a new dwv.App instance.
      const app = new dwv.App();
      app.init({
        containerDivId: tempDiv.id,
        tools: {},
        viewOnFirstLoadItem: true,
      });

      // Set a default data view configuration.
      const viewConfig = new dwv.ViewConfig(tempDiv.id);
      viewConfig.orientation = ""; // Default orientation.
      const viewConfigs = { "*": [viewConfig] };
      app.setDataViewConfigs(viewConfigs);

      // Handle load events.
      app.addEventListener("loadend", function () {
        const canvas = tempDiv.querySelector("canvas");
        if (canvas) {
          // Create a thumbnail canvas.
          const thumbnailCanvas = document.createElement("canvas");
          const context = thumbnailCanvas.getContext("2d");
          const scale = 100 / canvas.width; // Scale factor.
          thumbnailCanvas.width = 100;
          thumbnailCanvas.height = canvas.height * scale;
          context.drawImage(
            canvas,
            0,
            0,
            thumbnailCanvas.width,
            thumbnailCanvas.height
          );

          const dataURL = thumbnailCanvas.toDataURL();
          resolve(dataURL);
        } else {
          reject(new Error("Canvas not found"));
        }

        // Clean up.
        app.reset();
        if (tempDiv.parentNode) {
          tempDiv.parentNode.removeChild(tempDiv);
        }
      });

      app.addEventListener("loaderror", function (event) {
        app.reset();
        if (tempDiv.parentNode) {
          tempDiv.parentNode.removeChild(tempDiv);
        }
        reject(event.error);
      });

      // Load the DICOM image.
      app.loadURLs([url]);
    });
  }

  /**
   * Process a folder recursively. If the folder contains DICOM files and is not to be skipped,
   * fetch its DICOM URLs, load the first valid series, and add it to the interface. Then, process
   * any subfolders.
   *
   * @param {firebase.storage.Reference} folderRef - The current folder reference.
   */
  async function processFolder(folderRef, accPath = "") {
    const { items, prefixes } = await folderRef.listAll();
    // Build the full path by appending the current folder name
    const currentFullPath = accPath
      ? `${accPath}/${folderRef.name}`
      : folderRef.name;
    const seriesName = folderRef.name; // display name
    const lowerCaseSeriesName = seriesName.toLowerCase();

    // Define names to skip.
    const skipSeriesNames = [
      "<mip range>",
      "mip range",
      "phoenixzipreport",
      "localizer",
      "posdisp",
    ];
    const shouldSkip = skipSeriesNames.some((skipStr) =>
      lowerCaseSeriesName.includes(skipStr)
    );

    // If the folder contains files, check for DICOM files.
    if (items.length > 0) {
      const dcmItems = items.filter((item) =>
        item.name.toLowerCase().endsWith(".dcm")
      );
      if (dcmItems.length > 0 && !shouldSkip) {
        // Valid series found. Fetch all DICOM URLs recursively.
        const seriesUrlsMapping = await fetchAllSeriesUrlsRecursively(
          folderRef
        );
        const seriesUrls = seriesUrlsMapping[seriesName];
        if (seriesUrls) {
          // Load the first valid series immediately.
          if (!firstSeriesLoaded) {
            // Note: pass the full path as the second argument
            loadFolderContents(seriesUrls, currentFullPath, "myapp");
            showLoadingIndicator(false);
            firstSeriesLoaded = true;
          }
          // Add the series to the thumbnail interface.
          // Pass the full path so that later you have access to it
          addSeriesToFolderSelectionInterface(currentFullPath, seriesUrls);
        }
      }
    }

    // Process subfolders recursively.
    for (const subfolder of prefixes) {
      await processFolder(subfolder, currentFullPath);
    }
  }

  /**
   * Fetch and render the new folder structure.
   */

  async function fetchAndRenderNewStructure() {
    showLoadingIndicator(true);

    const storageRef = firebase.storage().ref(FirebasePath);

    try {
      // Initialize the series interface.
      initializeFolderSelectionInterface();
      document.getElementById("folderSelectionContainer").style.display =
        "block"; // Show the interface.

      // Start processing from the root folder.
      await processFolder(storageRef);

      if (!firstSeriesLoaded) {
        console.error("No series found in the storage path.");
        showLoadingIndicator(false);
      }
    } catch (error) {
      console.error("Error fetching series URLs:", error);
      showLoadingIndicator(false);
    }
  }

  /**
   * Initialize the folder selection interface.
   */
  function initializeFolderSelectionInterface() {
    const container = document.getElementById("folderSelectionContainer");
    container.innerHTML = "";

    const seriesList = document.createElement("div");
    seriesList.id = "seriesList1";
    seriesList.className = "series-list";

    container.appendChild(seriesList);
  }

  /**
   * Add a series thumbnail to the folder selection interface.
   *
   * @param {string} seriesName - The name of the series.
   * @param {Array<string>} seriesUrls - An array of DICOM URLs.
   */
  function addSeriesToFolderSelectionInterface(seriesName, seriesUrls) {
    const seriesList = document.getElementById("seriesList1");
    if (!seriesList) {
      console.error(
        "seriesList1 not found. Make sure initializeFolderSelectionInterface() was called first."
      );
      return;
    }

    const seriesItem = document.createElement("div");
    seriesItem.className = "series-item";
    seriesItem.setAttribute("draggable", "true");

    seriesItem.addEventListener("dragstart", (e) => {
      console.log("dragstart event fired for series:", seriesName);
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({ seriesName, seriesUrls })
      );
    });

    const img = document.createElement("img");
    img.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wkAAwAF/gL+UBkAAAAASUVORK5CYII=";
    img.alt = "Loading thumbnail...";
    img.className = "series-thumbnail";

    const sliceCount = seriesUrls.length;
    // Only display the last segment of the seriesName
    const displayName = seriesName.split("/").pop();
    const label = document.createElement("div");
    label.textContent = `${displayName} (${sliceCount} slices)`;
    label.className = "series-label";

    seriesItem.appendChild(img);
    seriesItem.appendChild(label);

    seriesItem.addEventListener("click", () => {
      console.log(
        `Series ${seriesName} clicked, loading into layerGroup0 by default.`
      );
      loadFolderContents(seriesUrls, seriesName, "layerGroup0");
    });

    seriesList.appendChild(seriesItem);

    // Generate and set the thumbnail.
    const firstImageUrl = seriesUrls[0];
    generateThumbnailFromDICOM(firstImageUrl)
      .then((dataURL) => {
        img.src = dataURL;
      })
      .catch((error) => {
        console.error(
          "Error generating thumbnail for series",
          seriesName,
          error
        );
        img.src = "https://via.placeholder.com/100";
      });
  }

  function loadFolderContents(
    urls,
    seriesName,
    targetLayerGroupId = "layerGroup0"
  ) {
    srURLs = urls.filter((u) => u.toLowerCase().includes("dicom-sr-")); // Store SR annotations
    const normalURLs = urls.filter(
      (u) => !u.toLowerCase().includes("dicom-sr-")
    );

    // Use only normal URLs for the first load
    url = normalURLs;

    if (targetLayerGroupId === "layerGroup1") {
      // Load in Comparison Mode
      if (!myapp2) {
        window.myapp2 = new dwv.App();
        myapp2.init(options);
        myapp2.setDataViewConfigs(comparisonConfigs1);
      } else {
        myapp2.reset();
        myapp2.init(options);
        myapp2.setDataViewConfigs(comparisonConfigs1);
      }
      myapp2.loadURLs(normalURLs);
      myapp2.getToolboxController().setSelectedTool("Scroll");
      console.log(`Loaded series: ${seriesName} into layerGroup1 via myapp2`);
    } else {
      // Determine which view configuration to use.
      let configsToUse =
        isMprActive && window.mprViewConfigs
          ? window.mprViewConfigs
          : isComparisonOpen
          ? comparisonConfigs0
          : singleViewConfigs0;

      myapp.reset();
      myapp.init(options);
      myapp.setDataViewConfigs(configsToUse);

      // Bind the layer groups so that position, window level, zoom, etc. are synchronized.
      const binders = [
        "PositionBinder",
        "WindowLevelBinder",
        "ZoomBinder",
        "OffsetBinder",
        "OpacityBinder",
        "ColourMapBinder",
      ];
      myapp.setLayerGroupsBinders(binders);

      // Load normal DICOM images.
      myapp.loadURLs(normalURLs);

      // Load annotations (SR) after main images load.
      myapp.addEventListener("loadend", function onLoadEndSR() {
        myapp.removeEventListener("loadend", onLoadEndSR);
        if (srURLs.length > 0) {
          console.log("🔄 Loading SR annotations...");
          myapp.loadURLs(srURLs);
        } else {
          console.warn("⚠ No SR annotations found.");
        }
      });

      myapp.getToolboxController().setSelectedTool("Scroll");
      console.log(`📂 Loaded series: ${seriesName} into layerGroup0 via myapp`);

      // Ensure Crosshairs & Annotations load in MPR mode.
      if (isMprActive) {
        myapp.addEventListener("loadend", function onLoadEndMPR() {
          myapp.removeEventListener("loadend", onLoadEndMPR);
          if (srURLs.length > 0) {
            console.log("🔄 Loading SR annotations in MPR mode...");
            myapp.loadURLs(srURLs);
          }
        });

        myapp.addEventListener("load", function onRenderEndNewSeries() {
          myapp.getLayerGroupByDivId("layerGroup0").setShowCrosshair(true);
          myapp.getLayerGroupByDivId("layerGroup1").setShowCrosshair(true);
          myapp.getLayerGroupByDivId("layerGroup2").setShowCrosshair(true);
          myapp.removeEventListener("load", onRenderEndNewSeries);
        });
      }
    }

    toolboxGui.setCurrentSeries(seriesName);
  }

  //NEW

  function showLoadingIndicator(show) {
    const indicator = document.getElementById("loadingIndicator");
    if (indicator) {
      indicator.style.display = show ? "block" : "none";
    }
  }

  function fetchAndRenderOldStructure() {
    showLoadingIndicator(true);
    const storageRef = firebase.storage().ref();
    const fileURLs = [];

    storageRef
      .child(FirebasePath)
      .listAll()
      .then((res) => {
        res.items.forEach((itemRef) => {
          itemRef
            .getDownloadURL()
            .then((url) => {
              fileURLs.push(url);

              if (fileURLs.length === res.items.length) {
                myapp.loadURLs(fileURLs);
                showLoadingIndicator(false);
              }
            })
            .catch((error) => {
              console.log("Error getting download URL:", error);
              showLoadingIndicator(false);
            });
        });
      })
      .catch((error) => {
        console.log("Error listing files:", error);
        showLoadingIndicator(false);
      });
  }

  checkVersionAndRenderDICOM(AnnotationPath);
}

// Image decoders (for web workers)
dwv.decoderScripts.jpeg2000 =
  "node_modules/dwv/decoders/pdfjs/decode-jpeg2000.js";
dwv.decoderScripts["jpeg-lossless"] =
  "node_modules/dwv/decoders/rii-mango/decode-jpegloss.js";
dwv.decoderScripts["jpeg-baseline"] =
  "node_modules/dwv/decoders/pdfjs/decode-jpegbaseline.js";
dwv.decoderScripts.rle = "node_modules/dwv/decoders/dwv/decode-rle.js";

// status flags
var domContentLoaded = false;
var i18nInitialised = false;
// launch when both DOM and i18n are ready
function launchApp() {
  if (domContentLoaded && i18nInitialised) {
    startApp();
  }
}
// i18n ready?
dwvjq.i18n.onInitialised(function () {
  var onLoaded = function (data) {
    dwvjq.gui.info.overlayMaps = data;
    i18nInitialised = true;
    launchApp();
  };
  $.getJSON(dwvjq.i18n.getLocalePath("overlays.json"), onLoaded).fail(
    function () {
      console.log("Using fallback overlays.");
      $.getJSON(dwvjq.i18n.getFallbackLocalePath("overlays.json"), onLoaded);
    }
  );
});

// initialise i18n
dwvjq.i18n.initialise("auto", "./resources");

// DOM ready?
$(document).ready(function () {
  domContentLoaded = true;
  launchApp();
});
