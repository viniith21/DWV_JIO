// namespaces
var dwvjq = dwvjq || {};
dwvjq.gui = dwvjq.gui || {};

/**
 * Toolbox base gui.
 * @constructor
 */
dwvjq.gui.Toolbox = function (app) {
  var toolGuis = {};

  /**
   * Setup the toolbox HTML.
   * @param {Object} list The tool list
   */
  this.setup = function (list) {
    // Tool-to-icon mapping
    var toolIcons = {
      Scroll: "fa-solid fa-arrows-up-down",
      Opacity: "fa-solid fa-circle-half-stroke",
      WindowLevel: "fa-solid fa-boxes-stacked",
      Livewire: "fas fa-draw-polygon",
      Floodfill: "fas fa-fill-drip",
      ZoomAndPan: "fas fa-search-plus",
      Draw: "fas fa-pencil-alt",
      Filter: "fas fa-filter",
    };

    // Tool buttons
    for (var key in list) {
      // Create button for each tool
      var toolButton = document.createElement("button");
      toolButton.id = key + "Button";
      toolButton.className = "tool-button";
      toolButton.style.margin = "5px";

      // Create icon element based on the tool key
      var icon = document.createElement("i");
      icon.className = toolIcons[key] || "fas fa-toolbox"; // Default icon if not mapped

      // Add the icon to the button
      toolButton.appendChild(icon);

      // Set the title attribute for hover text
      toolButton.title = key; // This sets the hover text to the tool name

      // Set button onclick functionality
      toolButton.onclick = function (event) {
        // Set the tool in the app
        var toolName = event.currentTarget.id.replace("Button", ""); // Get the tool name
        app.setTool(toolName);
        // Show tool gui
        for (var gui in toolGuis) {
          toolGuis[gui].display(false);
        }
        toolGuis[toolName].display(true);
      };

      // Append the button to the container (e.g., dwv-toolList div)
      var node = document.getElementById("dwv-toolList");
      node.appendChild(toolButton);
    }

    // Create tool gui and call setup
    for (var key in list) {
      var guiClass = key;
      var gui = null;
      if (guiClass === "Livewire") {
        gui = new dwvjq.gui.ColourTool(app, "lw");
      } else if (guiClass === "Floodfill") {
        gui = new dwvjq.gui.ColourTool(app, "ff");
      } else {
        if (typeof dwvjq.gui[guiClass] === "undefined") {
          console.warn("Could not create unknown loader gui: " + guiClass);
          continue;
        }
        gui = new dwvjq.gui[guiClass](app);
      }

      if (guiClass === "Filter" || guiClass === "Draw") {
        gui.setup(list[key].options);
      } else {
        gui.setup();
      }

      // Store
      toolGuis[guiClass] = gui;
    }
  };

  /**
   * Display the toolbox HTML.
   * @param {Boolean} bool True to display, false to hide.
   */
  this.display = function (bool) {
    // Find the buttons and toggle their visibility
    var toolButtons = document.getElementsByClassName("tool-button");
    for (var i = 0; i < toolButtons.length; i++) {
      toolButtons[i].style.display = bool ? "inline-block" : "none";
    }
  };

  /**
   * Initialise the toolbox HTML.
   */
  this.initialise = function () {
    var first = true;
    for (var guiClass in toolGuis) {
      toolGuis[guiClass].display(false);
      var canInit = toolGuis[guiClass].initialise();
      if (canInit && first) {
        app.setTool(guiClass);
        toolGuis[guiClass].display(true);
        first = false;
      }
    }
  };
}; // dwvjq.gui.Toolbox

/**
 * Opacity tool base gui.
 * @constructor
 */
dwvjq.gui.Opacity = function (app) {
  this.setup = function () {
    // Create a slider or input to adjust opacity
    var opacityInput = document.createElement("input");
    opacityInput.type = "range";
    opacityInput.min = 0;
    opacityInput.max = 1;
    opacityInput.step = 0.01;
    opacityInput.id = "opacityInput";
    opacityInput.style.margin = "5px";

    // Update the app's opacity setting when the input changes
    opacityInput.oninput = function () {
      app.setOpacity(opacityInput.value);
    };

    // Append the input to the tool list
    var node = document.getElementById("dwv-toolList");
    node.appendChild(opacityInput);
  };

  this.display = function (bool) {
    var opacityInput = document.getElementById("opacityInput");
    if (opacityInput) {
      opacityInput.style.display = bool ? "inline-block" : "none";
    }
  };

  this.initialise = function () {
    return true;
  };
}; // class dwvjq.gui.Opacity

/**
 * WindowLevel tool base gui.
 * @constructor
 */
// WindowLevel tool base gui.
dwvjq.gui.WindowLevel = function (app) {
  /**
   * Setup the tool HTML (called once).
   */
  this.setup = function () {
    // -----------------------------------------------------
    // Create the W/L preset select
    // -----------------------------------------------------
    var presetDropdown = document.createElement("select");
    presetDropdown.id = "presetDropdown";
    presetDropdown.style.display = "none"; // We'll control visibility in .display()

    presetDropdown.onchange = function (event) {
      app.setWindowLevelPreset(event.currentTarget.value);
    };

    // -----------------------------------------------------
    // Create the Colour Map select
    // -----------------------------------------------------
    var cmDropdown = document.createElement("select");
    cmDropdown.id = "cmDropdown";
    cmDropdown.style.display = "none"; // We'll control visibility in .display()

    // Populate the Colour Map select from dwv.luts
    Object.keys(dwv.luts).forEach(function (lutName) {
      var option = document.createElement("option");
      option.value = lutName;
      // Capitalize first letter
      option.text = lutName.charAt(0).toUpperCase() + lutName.slice(1);
      cmDropdown.appendChild(option);
    });

    cmDropdown.onchange = function () {
      app.setColourMap(cmDropdown.value);
    };

    // -----------------------------------------------------
    // Append both selects to your UI container
    // -----------------------------------------------------
    var node = document.getElementById("dwv-toolList");
    if (node) {
      node.appendChild(presetDropdown);
      node.appendChild(cmDropdown);
    } else {
      console.error('Element with ID "dwv-toolList" not found.');
    }
  };

  /**
   * Display the tool HTML.
   * @param {Boolean} bool True to show, false to hide.
   */
  this.display = function (bool) {
    var presetDropdown = document.getElementById("presetDropdown");
    var cmDropdown = document.getElementById("cmDropdown");

    if (presetDropdown) {
      presetDropdown.style.display = bool ? "inline-block" : "none";
    }
    if (cmDropdown) {
      cmDropdown.style.display = bool ? "inline-block" : "none";
    }

    // This listener adds new presets on the fly
    var onAddPreset = function (event) {
      // e.g. event.name = "lung"
      if (presetDropdown) {
        var option = new Option(
          // Optionally capitalize
          event.name.charAt(0).toUpperCase() + event.name.slice(1),
          event.name
        );
        presetDropdown.add(option);
        // Set new one as selected
        presetDropdown.selectedIndex = presetDropdown.options.length - 1;
      }
    };

    // Add/remove event listener based on show/hide
    if (bool) {
      app.addEventListener("wlpresetadd", onAddPreset);
    } else {
      app.removeEventListener("wlpresetadd", onAddPreset);
    }
  };

  /**
   * Initialise the tool HTML (called each time the tool is selected).
   * @returns {Boolean} True if the tool can be shown.
   */
  this.initialise = function () {
    if (!app.canWindowLevel()) {
      return false;
    }

    // Grab the current list of W/L presets and populate
    var layerGroup = app.getActiveLayerGroup();
    if (!layerGroup) {
      return false;
    }
    var viewController = layerGroup.getActiveViewLayer().getViewController();
    var presetNames = viewController.getWindowLevelPresetsNames() || [];

    var presetDropdown = document.getElementById("presetDropdown");
    if (presetDropdown) {
      // Clear any existing
      presetDropdown.innerHTML = "";
      // Populate from known presets
      presetNames.forEach(function (pname) {
        var option = document.createElement("option");
        option.value = pname;
        // Capitalize or adapt
        option.text = pname.charAt(0).toUpperCase() + pname.slice(1);
        presetDropdown.appendChild(option);
      });
    }

    // Colour map: handle MONOCHROME1 special case
    var cmDropdown = document.getElementById("cmDropdown");
    if (
      cmDropdown &&
      app.getData(0) &&
      app.getData(0).image.getPhotometricInterpretation() === "MONOCHROME1"
    ) {
      // Typically MONOCHROME1 is the 2nd entry, but confirm your actual LUT order
      cmDropdown.selectedIndex = 1;
    }

    return true;
  };
};
// class dwvjq.gui.WindowLevel

/**
 * Draw tool base gui.
 * @constructor
 */
dwvjq.gui.Draw = function (app) {
  // Default colours
  var colours = [
    "Yellow",
    "Red",
    "White",
    "Green",
    "Blue",
    "Lime",
    "Fuchsia",
    "Black",
  ];

  // Default shapes (can be modified as per your app's shape list)
  var shapeList = [
    "Arrow",
    "Ruler",
    "Protractor",
    "Rectangle",
    "Roi",
    "Ellipse",
    "Circle",
    // "FreeHand",
  ];

  /**
   * Setup the tool HTML.
   */
  this.setup = function () {
    // Create shape dropdown (instead of button)
    var shapeSelector = document.createElement("select");
    shapeSelector.id = "shapeSelect";
    shapeSelector.style.margin = "5px";

    // Populate the shape dropdown with options
    shapeList.forEach(function (shape) {
      var option = document.createElement("option");
      option.value = shape;
      option.textContent = shape;
      shapeSelector.appendChild(option);
    });

    // Shape selection event
    shapeSelector.onchange = function (event) {
      app.setToolFeatures({ shapeName: event.currentTarget.value });
    };

    // Create color dropdown (instead of button)
    var colourSelector = document.createElement("select");
    colourSelector.id = "colourSelect";
    colourSelector.style.margin = "5px";

    // Populate the colour dropdown with options
    colours.forEach(function (colour) {
      var option = document.createElement("option");
      option.value = colour;
      option.textContent = colour;
      colourSelector.appendChild(option);
    });

    // Color selection event
    colourSelector.onchange = function (event) {
      app.setToolFeatures({ shapeColour: event.currentTarget.value });
    };

    // Append both dropdowns to the tool list
    var node = document.getElementById("dwv-toolList");
    node.appendChild(shapeSelector);
    node.appendChild(colourSelector);
  };

  /**
   * Display the tool HTML.
   * @param {Boolean} bool True to display, false to hide.
   */
  this.display = function (bool) {
    // Show or hide shape selector
    document.getElementById("shapeSelect").style.display = bool
      ? "inline-block"
      : "none";
    // Show or hide colour selector
    document.getElementById("colourSelect").style.display = bool
      ? "inline-block"
      : "none";

    // Set the selected shape when the tool is displayed
    if (bool) {
      var shapeSelector = document.getElementById("shapeSelect");
      app.setToolFeatures({
        shapeName: shapeSelector.options[shapeSelector.selectedIndex].value,
      });
    }
  };

  /**
   * Initialise the tool HTML.
   * @returns Boolean True if the tool can be shown.
   */
  this.initialise = function () {
    // Initialise shape selector: reset selected option
    var shapeSelector = document.getElementById("shapeSelect");
    shapeSelector.selectedIndex = 0;
    dwvjq.gui.refreshElement(shapeSelector);

    // Initialise colour selector: reset selected option
    var colourSelector = document.getElementById("colourSelect");
    colourSelector.selectedIndex = 0;
    dwvjq.gui.refreshElement(colourSelector);

    return true;
  };
}; // class dwvjq.gui.Draw

/**
 * ColourTool base gui for tools with a colour setting.
 * @constructor
 */
// dwvjq.gui.ColourTool = function (app, prefix) {
//   // Define available colours
//   var colours = [
//     { name: "Yellow", value: "#FFFF00" },
//     { name: "Red", value: "#FF0000" },
//     { name: "White", value: "#FFFFFF" },
//     { name: "Green", value: "#00FF00" },
//     { name: "Blue", value: "#0000FF" },
//     { name: "Lime", value: "#00FF80" },
//     { name: "Fuchsia", value: "#FF00FF" },
//     { name: "Black", value: "#000000" },
//   ];

//   var colourSelectId = prefix + "ColourSelect";
//   var buttonId = prefix + "ColourButton";

//   /**
//    * Setup the tool HTML.
//    */
//   this.setup = function () {
//     // Create a button to open the color selector dropdown
//     var colourToolButton = document.createElement("button");
//     colourToolButton.id = buttonId;
//     colourToolButton.textContent = "Select Colour";
//     colourToolButton.style.margin = "5px";

//     // Create the select dropdown for colours
//     var colourSelector = document.createElement("select");
//     colourSelector.id = colourSelectId;
//     colourSelector.style.display = "none"; // Initially hidden

//     // Add options to the dropdown
//     colours.forEach(function (colour) {
//       var option = document.createElement("option");
//       option.value = colour.value;
//       option.textContent = colour.name;
//       colourSelector.appendChild(option);
//     });

//     // Append the button and the select to the tool list
//     var node = document.getElementById("dwv-toolList");
//     node.appendChild(colourToolButton);
//     node.appendChild(colourSelector);

//     // Add an event listener to the button to toggle the display of the dropdown
//     colourToolButton.onclick = function () {
//       // Toggle the dropdown visibility
//       colourSelector.style.display =
//         colourSelector.style.display === "none" ? "inline-block" : "none";
//     };

//     // Add an event listener to the select dropdown to update the color when selected
//     colourSelector.onchange = function (event) {
//       app.setToolFeatures({ shapeColour: event.target.value });
//       console.log("Selected colour:", event.target.value);
//       colourSelector.style.display = "none"; // Hide dropdown after selection
//     };
//   };

//   /**
//    * Display the tool HTML.
//    * @param {Boolean} bool True to display, false to hide.
//    */
//   this.display = function (bool) {
//     // Show/hide the button and dropdown based on the boolean parameter
//     document.getElementById(buttonId).style.display = bool
//       ? "inline-block"
//       : "none";
//     document.getElementById(colourSelectId).style.display = "none"; // Always hide dropdown initially
//   };

//   /**
//    * Initialise the tool HTML.
//    * @returns {Boolean} True if the tool can be shown.
//    */
//   this.initialise = function () {
//     return true;
//   };
// }; // class dwvjq.gui.ColourTool

dwvjq.gui.ColourTool = function (app, prefix) {
  // Define available colours
  var colours = [
    { name: "Yellow", value: "#FFFF00" },
    { name: "Red", value: "#FF0000" },
    { name: "White", value: "#FFFFFF" },
    { name: "Green", value: "#00FF00" },
    { name: "Blue", value: "#0000FF" },
    { name: "Lime", value: "#00FF80" },
    { name: "Fuchsia", value: "#FF00FF" },
    { name: "Black", value: "#000000" },
  ];

  var colourSelectId = prefix + "ColourSelect";

  /**
   * Setup the tool HTML.
   */
  this.setup = function () {
    // Create the select dropdown for colours
    var colourSelector = document.createElement("select");
    colourSelector.id = colourSelectId;
    colourSelector.style.margin = "5px";
    colourSelector.style.display = "none"; // Initially hidden

    // Add options to the dropdown
    colours.forEach(function (colour) {
      var option = document.createElement("option");
      option.value = colour.value;
      option.textContent = colour.name;
      colourSelector.appendChild(option);
    });

    // Append the select dropdown to the tool list
    var node = document.getElementById("dwv-toolList");
    node.appendChild(colourSelector);

    // Add an event listener to update the selected color
    colourSelector.onchange = function (event) {
      app.setToolFeatures({ shapeColour: event.target.value });
      console.log("Selected colour:", event.target.value);
    };
  };

  /**
   * Display the tool HTML.
   * @param {Boolean} bool True to display, false to hide.
   */
  this.display = function (bool) {
    var colourSelector = document.getElementById(colourSelectId);
    if (colourSelector) {
      colourSelector.style.display = bool ? "inline-block" : "none";
    }
  };

  /**
   * Initialise the tool HTML.
   * @returns {Boolean} True if the tool can be shown.
   */
  this.initialise = function () {
    return true;
  };
};

/**
 * ZoomAndPan tool base gui.
 * @constructor
 */
dwvjq.gui.ZoomAndPan = function (app) {
  this.setup = function () {
    // Create the button
    var zoomResetButton = document.createElement("button");
    zoomResetButton.id = "zoomResetButton";
    zoomResetButton.style.margin = "5px";

    // Add the Font Awesome icon
    var icon = document.createElement("i");
    icon.className = "fas fa-search-minus"; // Font Awesome class for the "reset zoom" icon
    zoomResetButton.appendChild(icon);

    // Reset zoom on click
    zoomResetButton.onclick = function () {
      app.resetZoom();
    };

    // Append the button to the tool list
    var node = document.getElementById("dwv-toolList");
    node.appendChild(zoomResetButton);
  };

  this.display = function (bool) {
    document.getElementById("zoomResetButton").style.display = bool
      ? "inline-block"
      : "none";
  };

  this.initialise = function () {
    return true;
  };
}; // class dwvjq.gui.ZoomAndPan

/**
 * Scroll tool base gui.
 * @constructor
 */
dwvjq.gui.Scroll = function (app) {
  this.setup = function () {
    var scrollButton = document.createElement("button");
    scrollButton.id = "scrollButton";
    scrollButton.textContent = "Scroll";
    scrollButton.style.margin = "5px";
    scrollButton.onclick = function () {
      app.scroll();
    };

    var node = document.getElementById("dwv-toolList");
    node.appendChild(scrollButton);
  };

  this.display = function (bool) {
    document.getElementById("scrollButton").style.display = "none";
  };

  // For Highlighting the buttons after selecting any toollist button
  document.querySelectorAll(".tool-button").forEach(function (button) {
    button.addEventListener("click", function () {
      // Remove the 'selected' class from all buttons
      document.querySelectorAll(".tool-button").forEach(function (btn) {
        btn.classList.remove("selected");
      });

      // Add the 'selected' class to the clicked button
      button.classList.add("selected");
    });
  });

  this.initialise = function () {
    return true;
  };
}; // class dwvjq.gui.Scroll

// Refresh the tool buttons
dwvjq.gui.refreshElement = function (element) {
  // Implement a refresh function to update DOM if needed
};
