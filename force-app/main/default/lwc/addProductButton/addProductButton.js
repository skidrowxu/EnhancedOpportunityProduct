/* eslint-disable */
import { LightningElement, api, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getPricebookEntries from "@salesforce/apex/AddProductButtonHandler.getPricebookEntries";
import getInitData from "@salesforce/apex/AddProductButtonHandler.getInitData";
import getPricebookEntriesWithFilter from "@salesforce/apex/AddProductButtonHandler.getPricebookEntriesWithFilter";
import getDataWithTotalLength from "@salesforce/apex/AddProductButtonHandler.getDataWithTotalLength";
import getPricebookEntry from "@salesforce/apex/AddProductButtonHandler.getPricebookEntry";
import getTotalNumberOfRows from "@salesforce/apex/AddProductButtonHandler.getTotalNumberOfRows";
import getFieldMembers from "@salesforce/apex/AddProductButtonHandler.getFieldMembers";
import getRequiredFields from "@salesforce/apex/AddProductButtonHandler.getRequiredFields";
import saveOpportunityLineItems from "@salesforce/apex/AddProductButtonHandler.saveOpportunityLineItems";
import { restFields } from "c/productLineItem";
import { deepClone } from "c/utilities";

import { FlowNavigationNextEvent } from "lightning/flowSupport";

const productId = "product2.id";
const pricebookentryProductId = "pricebookentry.product2id";
const productName = "product2.name";
const productNameColumnObj = {
  label: "Product Name",
  fieldName: "Product2NameUrl",
  type: "url",
  typeAttributes: {
    label: { fieldName: "Product2Name" },
    target: "_blank"
  },
  sortable: true
};
const curObj = "PricebookEntry";
const oppoLineItemFields =
  "Product2.Name, OpportunityLineItem.Product2Id, OpportunityLineItem.Quantity, OpportunityLineItem.UnitPrice, OpportunityLineItem.ServiceDate, OpportunityLineItem.Description";
const borderThresholdOnHeader = 10;
const borderThresholdOnWrapper = 10;
let isPrimitive = (value) => !(value instanceof Object);

const itemsWidth = "90%";
const minWidthShort = "52px";
const minWidthLong = "206px";

export default class AddProductButton extends NavigationMixin(
  LightningElement
) {
  @api oppoId;
  @api fields;
  cleanedFields;
  isLoading = true;
  rowLimit = 15;
  rowOffSet = 0;
  itemHeight = "32px";
  restItemSize = "5%";
  itemWidth = "20%";
  clickedSaveButton = false;
  get paraObj() {
    return {
      limitSize: this.rowLimit,
      offset: this.rowOffSet,
      fields: this.cleanedFields ? this.cleanedFields : this.fields,
      oppoId: this.oppoId,
      checkedRecordIds:
        this.checkedPricebookEntryIds.size !== 0
          ? [...this.checkedPricebookEntryIds]
          : []
    };
  }
  get paraObjWithFilter() {
    return {
      paraWrapper: this.paraObj,
      filter: this.searchStr
    };
  }

  get numOfSelectedRows() {
    let p = this.template.querySelector(".selecticon");
    p &&
      (p.style.color =
        this.checkedPricebookEntryIds.size > 0
          ? "rgb(1, 118, 211)"
          : "rgb(24, 24, 24)");
    return this.selectedRows.length;
  }

  totalNumberOfRows = 0;
  filteredRowOffSet = 0;
  hasProductIdAndProductName = false;
  @track fieldMembers = [];
  @track pricebookEntries = [];

  objectApiName = "PricebookEntry";
  topNumForLookup = 3;

  columns = [];
  //when load to the last record of datatable, set this.searchStr to blank
  searchStr = "";
  /**
   * [[func1, func2], [func1, func2], [func1, func2], [func1, func2]...]
   * the first element is condition, and the second element is execution
   */
  columnMap = [
    [
      (type) =>
        ["ID", "REFERENCE", "STRING", "PICKLIST", "TEXTAREA"].includes(type),
      (field) => {
        if (
          field.name === "Name" &&
          field.objectName === "Product2" &&
          this.hasProductIdAndProductName
        ) {
          return {};
        }
        if (
          field.name === "Id" &&
          field.objectName === "Product2" &&
          this.hasProductIdAndProductName
        ) {
          return productNameColumnObj;
        }
        return {
          label: field.label,
          fieldName: field.objectName + field.name,
          type: "text",
          sortable: true
        };
      }
    ],
    [
      (type) => ["CURRENCY", "DOUBLE"].includes(type),
      (field) => ({
        label: "*" + field.label,
        fieldName: field.objectName + field.name,
        type:
          field.type === "CURRENCY"
            ? "currency"
            : field.type === "DOUBLE"
              ? "number"
              : "NO SUCH A TYPE",
        typeAttributes: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        sortable: true
      })
    ],
    [
      (type) => type === "DATE",
      (field) => ({
        label: field.label,
        fieldName: field.objectName + field.name,
        type: "date",
        sortable: true
      })
    ]
  ];

  constructor() {
    super();
    this.template.addEventListener("blur", this.handleBlur);
  }

  async connectedCallback() {
    // if productId and pricebookentryProductId exist concurrently,need to reomve pricebookentryProductId
    let fieldsLowerCase = this.fields.toLowerCase();
    this.cleanedFields = this.fields;
    if (
      fieldsLowerCase.includes(productId) &&
      fieldsLowerCase.includes(pricebookentryProductId)
    ) {
      let i =
        fieldsLowerCase.indexOf(pricebookentryProductId) +
        pricebookentryProductId.length;
      if (fieldsLowerCase.substring(i).trim().substring(0, 1) === ",") {
        let subStr = this.fields.subString(i);
        let commaIndex = subStr.indexOf(",");
        let str = subStr.substring(0, commaIndex + 1);
        let regEx = new RegExp(pricebookentryProductId + str, "gi");
        this.cleanedFields = this.fields.replace(regEx, "");
      } else {
        let regEx = new RegExp(pricebookentryProductId, "ig");
        this.cleanedFields = this.fields.replace(regEx, "");
      }
    }
    //'Product2.Id, Product2.Name, Product2.ProductCode, PricebookEntry.UnitPrice, Product2.Description, Product2.Family'
    //check if Product2.Id and Product2.Name exist concurrently
    if (
      fieldsLowerCase.includes(productName) &&
      fieldsLowerCase.includes(productId)
    ) {
      this.hasProductIdAndProductName = true;
    }
    let { fieldMembers, totalNumberOfRows, pricebookEntries } =
      await getInitData({ paraWrapperStr: JSON.stringify(this.paraObj) });
    this.fieldMembers = fieldMembers;
    this.totalNumberOfRows = totalNumberOfRows;
    this.pricebookEntries = this.updateEntries(pricebookEntries);
    // because LWC doesn't support array's push function. i.e.  this.columns.push(column); so we can use arr variable to work around,
    // the better way is to use spread operator ...this.columns to update this.columns this.columns don't have to be @track

    this.fieldMembers.forEach((el) => {
      const target = this.columnMap.find((e) => e[0](el.type));
      if (target) {
        const column = target[1](el);
        //check it is not a empty Object, due to one branch return {} in columnMap
        if (Object.keys(column).length > 0) {
          this.columns = [...this.columns, column];
        }
      } else {
        console.log("error in dynamic column loop");
      }
    });
    this.isLoading = false;
  }

  renderedCallback() {
    if (this.template.querySelector(".items")) {
      this.template
        .querySelector(".items")
        .addEventListener(
          "mousemove",
          this.handleMouseMoveOnHeaders.bind(this),
          { passive: true }
        );
    }
    if (this.template.querySelector(".removeIconItem")) {
      this.template
        .querySelector(".removeIconItem")
        .addEventListener(
          "mousemove",
          this.handleMouseMoveOnHeaders.bind(this),
          { passive: true }
        );
    }
  }

  // since the data for the datatable is from fields of two objects, so we convert all the fields to the format of SObjectName.FieldName
  updateEntries(pricebookEntries) {
    return pricebookEntries.map((el) => {
      let updatedEntry = {};
      if (el.Product2.Id) {
        updatedEntry.Product2NameUrl = "/" + el.Product2.Id;
      }
      for (const key in el) {
        if (isPrimitive(el[key])) {
          updatedEntry[curObj + key] = el[key];
        } else {
          for (const [subKey, subValue] of Object.entries(el[key])) {
            updatedEntry[key + subKey] = subValue;
          }
        }
      }
      return updatedEntry;
    });
  }

  async loadData() {
    this.rowOffSet = this.rowOffSet + this.rowLimit;
    try {
      let originalRecords;
      if (this.searchStr === "") {
        originalRecords = await getPricebookEntries({
          paraWrapperStr: JSON.stringify(this.paraObj)
        });
      } else {
        originalRecords = await getPricebookEntriesWithFilter({
          paraWrapperWithFilterStr: JSON.stringify(this.paraObjWithFilter)
        });
      }
      if (originalRecords.length > 0) {
        let newEntries = this.updateEntries(originalRecords);
        this.pricebookEntries = [...this.pricebookEntries, ...newEntries];
        if (this.checkedPricebookEntries.length > 0) {
          this.pricebookEntries.sort((a, b) =>
            a.Product2Name > b.Product2Name
              ? 1
              : b.Product2Name > a.Product2Name
                ? -1
                : 0
          );
        }
        this.error = undefined;
      }
    } catch (error) {
      this.error = error;
      this.pricebookEntries = undefined;
    }
  }

  async loadMoreData(event) {
    if (this.pricebookEntries.length > 0) {
      let { target } = event;
      !target.enableInfiniteLoading && (target.enableInfiniteLoading = true);
      if (this.pricebookEntries.length === this.totalNumberOfRows) {
        target.enableInfiniteLoading = false;
      } else {
        //show loading spinner
        target.isLoading = true;
        await this.loadData();
        //hide loading spinner
        target.isLoading = false;
      }
    }
  }

  async searchByKeywords(event) {
    this.rowOffSet = 0;
    this.searchStr = event.detail;
    this.pricebookEntries = [];
    // when the datatable enableInfiniteLoading is false, we change it to true, it will run loadMoreData function one time,
    // so we have to add if (this.pricebookEntries.length > 0) to tell the code if no data for the datatable, don't run loadMoreData function
    let { pricebookEntries, totalNumberOfRows } = await getDataWithTotalLength({
      paraWrapperWithFilterStr: JSON.stringify(this.paraObjWithFilter)
    });
    this.setPricebookEntries(pricebookEntries);
    this.totalNumberOfRows = totalNumberOfRows;
  }

  setPricebookEntries(originalRecords) {
    if (this.checkedPricebookEntries.length > 0) {
      this.pricebookEntries = [
        ...this.updateEntries(originalRecords),
        ...this.checkedPricebookEntries
      ];
      this.pricebookEntries.sort((a, b) =>
        a.Product2Name > b.Product2Name
          ? 1
          : b.Product2Name > a.Product2Name
            ? -1
            : 0
      );
      this.selectedRows = [...this.checkedPricebookEntryIds];
    } else {
      this.pricebookEntries = this.updateEntries(originalRecords);
    }
    this.reenableInfiniteLoading();
  }
  async searchAll() {
    this.rowOffSet = 0;
    this.searchStr = "";
    let originalRecords = await getPricebookEntries({
      paraWrapperStr: JSON.stringify(this.paraObj)
    });
    this.totalNumberOfRows = await getTotalNumberOfRows({
      oppoId: this.oppoId
    });
    this.setPricebookEntries(originalRecords);
    this.selectedRows = [...this.checkedPricebookEntryIds];
    if (this.checkedPricebookEntryIds.size > 0) {
      this.selectedRows = [...this.checkedPricebookEntryIds];
      this.pricebookEntries.sort((a, b) =>
        a.Product2Name.localeCompare(b.Product2Name)
      );
    }
  }

  reenableInfiniteLoading() {
    let datatable = this.template.querySelector("lightning-datatable");
    !datatable.enableInfiniteLoading &&
      (datatable.enableInfiniteLoading = true);
  }

  disableInfiniteLoading() {
    let datatable = this.template.querySelector("lightning-datatable");
    datatable.enableInfiniteLoading &&
      (datatable.enableInfiniteLoading = false);
  }

  @track selectedData = [];
  @track currentlySelectedData = [];

  handleRowSelection(event) {
    switch (event.detail.config.action) {
      case "selectAllRows":
        event.detail.selectedRows.forEach((e) => {
          this.checkedPricebookEntryIds.add(e.PricebookEntryId);
          this.checkedPricebookEntries.push(e);
          this.selectedRows.push(e.PricebookEntryId);
        });
        break;
      case "deselectAllRows":
        this.checkedPricebookEntryIds.clear();
        this.checkedPricebookEntries = [];
        this.selectedRows = [];
        break;
      case "rowSelect": {
        // console.log(JSON.parse(JSON.stringify(event.detail)));
        this.checkedPricebookEntryIds.add(event.detail.config.value);
        let selectedRecord = event.detail.selectedRows.find(
          (e) => e.PricebookEntryId === event.detail.config.value
        );
        this.checkedPricebookEntries.push(selectedRecord);
        // this.checkedPricebookEntries = event.detail.selectedRows;
        this.selectedRows.push(event.detail.config.value);
        break;
      }
      case "rowDeselect": {
        let deselectedId = event.detail.config.value;
        let index = this.selectedRows.indexOf(deselectedId);
        index > -1 && this.selectedRows.splice(index, 1);

        this.checkedPricebookEntryIds.delete(deselectedId);

        let i = this.checkedPricebookEntries.findIndex(
          (el) => el.PricebookEntryId === deselectedId
        );
        i > -1 && this.checkedPricebookEntries.splice(i, 1);
        // this.checkedPricebookEntries = event.detail.selectedRows;
        break;
      }
      default:
        break;
    }
  }

  @track selectedRows = [];
  checkedPricebookEntryIds = new Set();
  @track checkedPricebookEntries = [];
  async handleRecordSelected(event) {
    let selectedId = event.detail;
    this.checkedPricebookEntryIds.add(selectedId);
    let selectedPricebookEntry = this.pricebookEntries.find(
      (el) => el.PricebookEntryId === selectedId
    );
    if (!selectedPricebookEntry) {
      let originalRecords = await getPricebookEntry({
        id: selectedId,
        fields: this.fields
      });
      selectedPricebookEntry = this.updateEntries([originalRecords])[0];
      this.pricebookEntries = [
        ...this.pricebookEntries,
        selectedPricebookEntry
      ];
      this.pricebookEntries.sort((a, b) =>
        a.Product2Name.localeCompare(b.Product2Name)
      );
    }
    this.checkedPricebookEntries.push(selectedPricebookEntry);
    this.selectedRows = [...this.checkedPricebookEntryIds];
  }

  @track sortBy;
  @track sortDirection;
  doSorting(event) {
    this.sortBy = event.detail.fieldName;
    this.sortDirection = event.detail.sortDirection;
    let sortBy = this.sortBy;
    if (this.sortBy === "Product2NameUrl") {
      sortBy = "Product2Name";
    }
    this.sortData(sortBy, this.sortDirection);
  }
  sortData(fieldname, direction) {
    let dataClone = [...this.pricebookEntries];
    // Return the value stored in the field
    let isReverse = direction === "asc" ? 1 : -1;
    // sorting data
    this.pricebookEntries = dataClone.sort((x, y) => {
      x[fieldname] = x[fieldname] ? x[fieldname] : "";
      y[fieldname] = y[fieldname] ? y[fieldname] : "";
      return isReverse * x[fieldname].localeCompare(y[fieldname]);
    });
  }

  @api availableActions = [];
  handleCancel() {
    window.history.back();
  }

  //the methods below are for page 2

  //  we need to remove customFieldMember:[label=Product ID, name=Product2Id, objectName=OpportunityLineItem, type=REFERENCE],
  //  because it don't need to loop it

  @track oppoLineItemFieldMembers = [];
  @track requiredFields = [];
  isLoadingpage2 = true;
  isPage1 = true;
  async handleNext() {
    this.isPage1 = false;
    this.clickedSaveButton = false;
    let requiredFields = await getRequiredFields({
      objApiName: "OpportunityLineItem"
    });
    this.requiredFields = [...requiredFields];
    this.sObjectName = "";
    this.oppoLineItemFieldMembers = (
      await getFieldMembers({ fields: oppoLineItemFields })
    ).map((field, index) => {
      let fieldCope = {
        ...field,
        isLeftHovering: false,
        isRightHovering: false,
        isClicked: false,
        isResizing: false,
        lastMouseX: null,
        resizedWidth: null
      };
      if (index === 0) {
        this.sObjectName = fieldCope.objectName;
      }
      if (fieldCope.objectName !== "OpportunityLineItem") {
        fieldCope.name = fieldCope.objectName + fieldCope.name;
      }
      return fieldCope;
    });
    if (this.oppoLineItemFieldMembers.some((e) => e.name === "UnitPrice")) {
      this.requiredFields.push("UnitPrice");
    }
    if (
      this.oppoLineItemFieldMembers.some((e) => e.name === "Product2Name") &&
      this.oppoLineItemFieldMembers.some((e) => e.name === "Product2Id")
    ) {
      this.requiredFields.push("Product2Name");
      this.oppoLineItemFieldMembers = this.oppoLineItemFieldMembers.filter(
        (e) => e.name !== "Product2Id"
      );
    }
    this.oppoLineItemFieldMembers.map((e) => {
      if (this.requiredFields.includes(e.name)) {
        e.required = true;
      } else e.required = false;
      return e;
    });
    document.documentElement.style.setProperty(
      "--numOfItems",
      this.oppoLineItemFieldMembers.length
    );
    document.documentElement.style.setProperty(
      "--restItemSize",
      this.restItemSize
    );
    document.documentElement.style.setProperty("--itemsWidth", itemsWidth);
    document.documentElement.style.setProperty("--itemWidth", this.itemWidth);
    document.documentElement.style.setProperty("--itemHeight", this.itemHeight);
    document.documentElement.style.setProperty(
      "--minWidthShort",
      minWidthShort
    );
    document.documentElement.style.setProperty("--minWidthLong", minWidthLong);
    this.template.querySelector(".header").style.borderBottomStyle = "none";
    this.isLoadingpage2 = false;
    this.isInitialRun = true;

    //for getting a new order by index only, not order by indexRegen
    for (const rec of this.checkedPricebookEntries) {
      rec.indexRegen = undefined;
    }
    //register an event on blur of the page2 class div
    this.template.addEventListener("click", this.handleBlur);
  }

  isInputBlur = false;
  handleInputBlur() {
    this.isInputBlur = true;
  }

  isPage2TableClicked = false;
  handleBlur = (event) => {
    if (this.closeComponent) {
      return;
    }
    if (!this.isPage1 && !this.isInputBlur) {
      event.preventDefault();
      //if onblur from c-product-line-item component, don't run this handleBlur method
      if (
        !this.template.querySelector(".tabeleHeader").contains(event.target) &&
        !this.template.querySelector(".tableContent").contains(event.target)
      ) {
        //it only run the logic when the table cell is clicked
        if (this.isPage2TableClicked) {
          this.isPage2TableClicked = false;
          this.setIsClickedToFalse();
          this.unhighlightAllHeaders();
          this.hideTableCellStyle();
        }
      }
    } else {
      this.isInputBlur = false;
    }
  };

  handleBack() {
    this.isLoadingpage2 = true;
    this.isPage1 = true;
    //hide error icon next to the cancel button
    this.template.querySelector(
      '.errorIcon > lightning-icon[icon-name="utility:error"]'
    ).style.visibility = "hidden";

    // this.isInputBlur = true;
  }
  get showNextButton() {
    return this.numOfSelectedRows > 0 && this.isPage1;
  }
  get showSaveAndPreviousButton() {
    return !this.isPage1;
  }

  addHeaderStyle(div) {
    div.style.border = "solid rgb(11, 92, 171)";
    div.style.borderWidth = "1px 3px 1px 1px";
  }

  hideTableCellStyle() {
    //this.currentHighlightedCell hold the current highlighted cell coordinate
    if (JSON.stringify(this.currentHighlightedCell) !== "{}") {
      const currentProductLineItem = [
        ...this.template.querySelectorAll("c-product-line-item")
      ][this.currentHighlightedCell.index];
      //if there is a visible input box in the highlighted cell, hide the input box
      if (
        currentProductLineItem.isInputboxVisible(this.currentHighlightedCellDiv)
      ) {
        currentProductLineItem.hideInputBox(this.currentHighlightedCellDiv);
        this.isPage2TableClicked = true;
        return;
      }
      currentProductLineItem.updateBorderAndHideIcon(
        this.currentHighlightedCell.column,
        this.currentHighlightedCellDiv
      );

      this.currentHighlightedCell = {};
      this.currentHighlightedCellDiv = {};
      currentProductLineItem.initializeStatus();
    }
  }
  setIsClickedToFalse() {
    for (const field of this.oppoLineItemFieldMembers) {
      field.isClicked = false;
    }
    this.removeIconItem.isClicked = false;
  }
  isHeaderStyleBlocked = false;
  handleBolckHeaderStyle(e) {
    this.isHeaderStyleBlocked = e.detail;
  }
  clickHeader(event) {
    if (this.preventClick) {
      console.log("click event prevented");
      // Reset the flag
      this.preventClick = false;
      return; // Stop the click event from executing
    }
    const div = event.target;
    if (["orderNumItem", "item", "removeIconItem"].includes(div.className)) {
      if (!this.isInputBlur) {
        this.previousHighlightedCell = {};
        this.isPage2TableClicked = true;
        console.log("Header is clicked");
        this.unhighlightAllHeaders();
        this.setIsClickedToFalse();
        // let div = event.target;
        const index = +div.dataset.index;
        if (!isNaN(index)) {
          if (index === 5) {
            this.removeIconItem.isClicked = true;
          } else {
            this.oppoLineItemFieldMembers[index].isClicked = true;
          }
        }
        if (!this.isHeaderStyleBlocked) {
          this.addHeaderStyle(div);
        }
        this.hideTableCellStyle();
      } else {
        this.isInputBlur = false;
      }
    }
  }

  @track currentHighlightedCell = {};
  @track previousHighlightedCell = {};
  @track currentHighlightedCellDiv = {};
  handleClickField(event) {
    const currentCoordinate = JSON.parse(event.detail);
    if (!this.isInputBlur || restFields.includes(currentCoordinate.column)) {
      this.isPage2TableClicked = true;
      this.unhighlightAllHeaders();
      this.setIsClickedToFalse();
      this.previousHighlightedCell = { ...this.currentHighlightedCell };

      this.currentHighlightedCell = currentCoordinate;

      this.currentHighlightedCellDiv = [
        ...this.template.querySelectorAll("c-product-line-item")
      ][this.currentHighlightedCell.index].getcurrentHighlightedCell(
        this.currentHighlightedCell.column
      );

      //when previousHighlightedCell !== {};
      //means it is not the first time click the cell, there are previous highlighted cell
      if (JSON.stringify(this.previousHighlightedCell) !== "{}") {
        const { column: previousColumn, index: previousIndex } =
          this.previousHighlightedCell;

        [...this.template.querySelectorAll("c-product-line-item")][
          previousIndex
        ].unhighlightPreviousClickedCell(
          previousColumn,
          this.currentHighlightedCell
        );
      }
    } else {
      this.isInputBlur = false;
    }
  }

  unhighlightAllHeaders() {
    let divs = this.template.querySelectorAll(".tabeleHeader div");
    divs.forEach((div) => {
      if (div.style.borderWidth) {
        div.style.border = null;
        div.style.borderWidth = null;
      }
    });
  }

  // if any row has been deleted, then all the rows will be added one property called "indexRegen",
  // when the row' index equals to the deleted row's index, then the indexRegen will be null.
  // when no rows are deleted, the no indexRegen property, the each row's indexRegen is undefined.
  handleDeleteRow(e) {
    this.clickedSaveButton = false;
    const deletedRowIndex = e.detail;
    let newEntries = deepClone(this.checkedPricebookEntries);
    this.checkedPricebookEntries = newEntries.map((el, i) => {
      if (el.indexRegen !== null) {
        if (i < deletedRowIndex) {
          el.indexRegen = el.indexRegen !== undefined ? el.indexRegen : i;
        } else if (i === deletedRowIndex) {
          el.indexRegen = null;
        } else if (i > deletedRowIndex) {
          el.indexRegen = (el.indexRegen !== undefined ? el.indexRegen : i) - 1;
        }
      }
      return el;
    });
    this.template.querySelectorAll("c-product-line-item").forEach((cmp) => {
      cmp.hideErrorIcon();
      cmp.removeStylesForAllCells();
    });
    this.emptyPreviousHighlightedCell();
  }

  handleUpdateRow(e) {
    let { index, column, value } = JSON.parse(e.detail);
    this.checkedPricebookEntries = deepClone(this.checkedPricebookEntries);
    this.checkedPricebookEntries[index][column] = value;

    //hide all the row error icons
    this.template
      .querySelectorAll("c-product-line-item")
      .forEach((cmp) => cmp.hideErrorIcon());
  }

  get noItems() {
    for (const el of this.checkedPricebookEntries) {
      if (el.indexRegen !== null) {
        return false;
      }
    }
    return true;
  }

  errorSentences = [];
  maxErrorFieldsCount = 0;
  errorRowCount = 0;

  closeComponent = false;
  async handleSave() {
    this.clickedSaveButton = true;
    this.clickedFromSave = true;
    this.errorSentences = [];
    this.maxErrorFieldsCount = 0;
    this.errorRowCount = 0;
    this.emptyPreviousHighlightedCell();
    let removedIndexList = [];
    this.checkedPricebookEntries.forEach((el, i) => {
      if (
        Object.prototype.hasOwnProperty.call(el, "indexRegen") &&
        el.indexRegen === null
      ) {
        removedIndexList.push(i);
      }
    });
    this.template.querySelectorAll("c-product-line-item").forEach((cmp, i) => {
      if (!removedIndexList.includes(i)) {
        cmp.hideAllCellIcons();
        const { rowNumber, index, labels } =
          cmp.getRequiredFieldsWithoutValue();
        if (labels.length > 0) {
          if (this.maxErrorFieldsCount < labels.length) {
            this.maxErrorFieldsCount = labels.length;
          }
          this.errorRowCount++;
          const str = `Item ${rowNumber} has errors in these fields: ${labels.join(", ")}.`;
          this.errorSentences.push(str);

          if (i === index) {
            cmp.showErrorIcon();
            cmp.highlightEmptyCellsWithRed();
          }
        }
        for (const key in cmp.objOfData) {
          if (Object.hasOwnProperty.call(cmp.objOfData, key)) {
            const fieldObj = cmp.objOfData[key];
            if (fieldObj.required && fieldObj.value !== "") {
              //key is required  field API name
              const div = cmp.getcurrentHighlightedCell(key);
              cmp.removeStylesForRequiredFieldWithValue(div);
            }
          }
        }
      }
    });
    if (this.errorSentences.length > 0) {
      document.documentElement.style.setProperty(
        "--maxErrorFieldsCount",
        this.maxErrorFieldsCount
      );
      document.documentElement.style.setProperty(
        "--errorRowCount",
        this.errorRowCount
      );

      let errorMsgBox = this.template.querySelector(
        '.errorIcon > lightning-icon[icon-name="utility:error"]'
      );
      errorMsgBox.style.visibility = "visible";
      errorMsgBox.setAttribute("tabindex", 0);
      errorMsgBox.focus();
    } else {
      this.isLoadingpage2 = true;
      let opportunityLineItems = [];
      this.template
        .querySelectorAll("c-product-line-item")
        .forEach((cmp, i) => {
          if (!removedIndexList.includes(i)) {
            let opportunityLineItem = {};
            opportunityLineItem.OpportunityId = this.oppoId;
            opportunityLineItem.PricebookEntryId =
              this.checkedPricebookEntries[i].PricebookEntryId;
            opportunityLineItem.Product2Id =
              this.checkedPricebookEntries[i].Product2Id;
            for (const key in cmp.objOfData) {
              if (Object.hasOwnProperty.call(cmp.objOfData, key)) {
                const fieldObj = cmp.objOfData[key];
                if (
                  key !== "Product2Name" &&
                  ![null, ""].includes(fieldObj.value)
                ) {
                  opportunityLineItem[key] = fieldObj.value;
                }
              }
            }
            opportunityLineItems.push(opportunityLineItem);
          }
        });
      this.closeComponent = true;
      const returnStatus = await saveOpportunityLineItems({
        oppoLineItems: opportunityLineItems
      });
      if (returnStatus === "successed") {
        const completeURL = `${window.location.origin}/lightning/r/${this.sObjectName}/${this.oppoId}/related/OpportunityLineItems/view`;
        window.open(completeURL, "_parent");
      }
    }
  }

  handleGoNext() {
    // check if NEXT is allowed on this screen
    if (this.availableActions.find((action) => action === "NEXT")) {
      // navigate to the next screen
      const navigateNextEvent = new FlowNavigationNextEvent();
      this.dispatchEvent(navigateNextEvent);
    }
  }

  clickedFromSave = false;
  showErrorMsg() {
    this.template.querySelector(".errorMessage").style.visibility = "visible";
    if (!this.clickedFromSave) {
      const errorIcon = this.template.querySelector(
        '.errorIcon > lightning-icon[icon-name="utility:error"]'
      );
      errorIcon.style.border = "1px solid rgb(1, 118, 211)";
      errorIcon.style.boxShadow = "rgb(1, 118, 211) 0px 0px 3px 0px";
      errorIcon.style.borderRadius = "4px";
    } else {
      this.clickedFromSave = false;
    }
  }

  hideErrorMsg() {
    this.template.querySelector(".errorMessage").style.visibility = "hidden";
    const errorIcon = this.template.querySelector(
      '.errorIcon > lightning-icon[icon-name="utility:error"]'
    );
    errorIcon.style.border = null;
    errorIcon.style.borderRadius = null;
    errorIcon.style.boxShadow = null;
  }

  emptyPreviousHighlightedCell() {
    this.previousHighlightedCell = {};
    this.previousHighlightedCellDiv = [];
    this.currentHighlightedCell = {};
    this.currentHighlightedCellDiv = {};
  }

  removeBorderHeaderStyle(isFromChildCmp, hoveredindex, rowIndexFromChildCmp) {
    let clickedIndex = -1;
    let oneBeforeCurrDiv =
      hoveredindex - 1 >= 0
        ? this.template.querySelector(`[data-index="${hoveredindex - 1}"]`)
        : null;
    let currDiv = this.template.querySelector(`[data-index="${hoveredindex}"]`);
    let oneBeforeCurrWrapper = this.template.querySelector(
      `[data-wrapper-index="${hoveredindex - 1}"]`
    );
    let currWrapper = this.template.querySelector(
      `[data-wrapper-index="${hoveredindex}"]`
    );
    if (this.removeIconItem.isClicked) {
      clickedIndex = 5;
    } else {
      clickedIndex = this.oppoLineItemFieldMembers.findIndex(
        (el) => el.isClicked
      );
    }

    if (hoveredindex === 5) {
      if (isFromChildCmp) {
        this.template
          .querySelectorAll("c-product-line-item")
          [rowIndexFromChildCmp].removeCursorStyleOnMouseMove(hoveredindex);
      } else {
        currDiv = this.template.querySelector(".removeIconItem");
        currDiv.style.cursor = null;
        currWrapper = this.template.querySelector(".removeIconItemWrapper");
        currWrapper.style.cursor = null;
      }
      oneBeforeCurrWrapper.style.borderRight = null;
      if (clickedIndex === 4) {
        return;
      }
      oneBeforeCurrDiv.style.borderRight = null;
      return;
    }

    if (hoveredindex !== 5) {
      if (isFromChildCmp) {
        this.template
          .querySelectorAll("c-product-line-item")
          [rowIndexFromChildCmp].removeCursorStyleOnMouseMove(hoveredindex);
      } else {
        currDiv.style.cursor = null;
        currWrapper.style.cursor = null;
      }
      const isLeftHovering =
        this.oppoLineItemFieldMembers[hoveredindex].isLeftHovering;
      const isRightHovering =
        this.oppoLineItemFieldMembers[hoveredindex].isRightHovering;
      if (clickedIndex === -1) {
        if (oneBeforeCurrDiv) {
          oneBeforeCurrDiv.style.borderRight = null;
          oneBeforeCurrWrapper.style.borderRight = null;
        }
        currDiv.style.borderRight = null;
        currWrapper.style.borderRight = null;
        return;
      }
      if (clickedIndex !== -1) {
        if (hoveredindex === clickedIndex) {
          if (oneBeforeCurrDiv) {
            oneBeforeCurrDiv.style.borderRight = null;
            oneBeforeCurrWrapper.style.borderRight = null;
          }
          currWrapper.style.borderRight = null;
          return;
        }
        if (hoveredindex === clickedIndex + 1) {
          if (oneBeforeCurrDiv) {
            oneBeforeCurrWrapper.style.borderRight = null;
          }
          currDiv.style.borderRight = null;
          currWrapper.style.borderRight = null;
          return;
        }
        if (hoveredindex + 1 === clickedIndex) {
          if (hoveredindex !== 0 && oneBeforeCurrDiv) {
            oneBeforeCurrDiv.style.borderRight = null;
            oneBeforeCurrWrapper.style.borderRight = null;
          }
          currDiv.style.borderRight = null;
          currWrapper.style.borderRight = null;
          return;
        }
        if (isLeftHovering && hoveredindex !== 0) {
          oneBeforeCurrDiv.style.borderRight = null;
          oneBeforeCurrWrapper.style.borderRight = null;
          return;
        }
        if (isRightHovering) {
          currDiv.style.borderRight = null;
          currWrapper.style.borderRight = null;
        }
      }
    }
  }

  removeIconItem = {
    isLeftHovering: false,
    isClicked: false
  };

  currentHoveredIndex = -1;
  isMouseOutBanned = false;

  handleMouseMoveOnHeaders(e) {
    this.handleMouseMoveToBorder(e, borderThresholdOnHeader);
  }

  handleMouseMoveOnWrapper(e) {
    this.handleMouseMoveToBorder(e, borderThresholdOnWrapper);
  }

  handleMouseMoveFromChildCmp(e) {
    const { columnIndex, clientX, rowIndex } = JSON.parse(e.detail);
    this.handleMouseMoveToBorder(null, borderThresholdOnWrapper, {
      columnIndex,
      clientX,
      rowIndex
    });
  }

  updateCursorOnMouseMove(
    isFromChildCmp,
    childCmpValues,
    isFromHeader,
    currDiv,
    currWrapper
  ) {
    if (isFromChildCmp) {
      const { columnIndex, rowIndex } = childCmpValues;
      this.template
        .querySelectorAll("c-product-line-item")
        [rowIndex].updateCursorOnMouseMove(columnIndex);
      return;
    }
    if (isFromHeader) {
      currDiv.style.cursor = "col-resize";
    } else {
      currWrapper.style.cursor = "col-resize";
    }
  }
  handleMouseMoveToBorder(e, borderScope, childCmpValues) {
    let columnIndex, clientX, rowIndex;
    if (childCmpValues) {
      columnIndex = childCmpValues.columnIndex;
      clientX = childCmpValues.clientX;
      rowIndex = childCmpValues.rowIndex;
    }
    //if e is null, it is called by child component customn event handler, otherwise it is called by itself
    const index =
      e === null && columnIndex >= 0 && columnIndex < 6
        ? columnIndex
        : !isNaN(+e.target.dataset.index)
          ? +e.target.dataset.index
          : +e.target.dataset.wrapperIndex;
    const isFromHeader =
      e === null && columnIndex >= 0 && columnIndex < 6
        ? false
        : !isNaN(+e.target.dataset.index);

    if (index !== null && index >= 0 && index < 6) {
      const rect =
        e === null
          ? this.template
              .querySelector(`[data-index="${index}"]`)
              .getBoundingClientRect()
          : e.target.getBoundingClientRect();
      let mouseX = (e === null ? clientX : e.clientX) - rect.left;
      // Check if the mouse is within `borderScope` pixels from the right border
      const isRightBorder = mouseX > rect.width - borderScope ? true : false;
      // const isRightBorder = (mouseX > rect.width - borderScope && mouseX <= rect.width) ? true : false;
      // or from the left border
      // mouseX < 0 is due to inaccurate calculations when the mouse move to the left border
      // from the left side in the beginning accross the left border
      const isLeftBorder = mouseX < borderScope ? true : false;

      const noStyleStage =
        mouseX >= borderScope && mouseX <= rect.width - borderScope
          ? true
          : false;

      //left and the column cannot be removeIconItem, and right and the column cannot be Product2Name
      // isRightBorder  && index !== 5
      if ((isLeftBorder && index !== 0) || (isRightBorder && index !== 5)) {
        this.currentHoveredIndex = index;
        let oneBeforeCurrDiv =
          index - 1 >= 0
            ? this.template.querySelector(`[data-index="${index - 1}"]`)
            : null;
        let currDiv = this.template.querySelector(`[data-index="${index}"]`);
        let oneBeforeCurWrapper =
          index - 1 >= 0
            ? this.template.querySelector(`[data-wrapper-index="${index - 1}"]`)
            : null;
        let currWrapper = this.template.querySelector(
          `[data-wrapper-index="${index}"]`
        );
        if (index === 5 || isLeftBorder) {
          if (index === 5) {
            this.removeIconItem.isLeftHovering = true;
          } else if (isLeftBorder) {
            this.oppoLineItemFieldMembers[index].isLeftHovering = true;
            this.oppoLineItemFieldMembers[index].isRightHovering = false;
          }
          oneBeforeCurrDiv.style.borderRight = "3px solid rgb(11, 92, 171)";
          this.updateCursorOnMouseMove(
            e === null,
            childCmpValues,
            isFromHeader,
            currDiv,
            currWrapper
          );
          oneBeforeCurWrapper.style.borderRight = "1px  solid rgb(1, 118, 211)";
          return;
        }
        if (isRightBorder) {
          this.oppoLineItemFieldMembers[index].isLeftHovering = false;
          this.oppoLineItemFieldMembers[index].isRightHovering = true;
          currDiv.style.borderRight = "3px solid rgb(11, 92, 171)";
          this.updateCursorOnMouseMove(
            e === null,
            childCmpValues,
            isFromHeader,
            currDiv,
            currWrapper
          );
          currWrapper.style.borderRight = "1px  solid rgb(1, 118, 211)";
        }
      } else if (noStyleStage) {
        this.currentHoveredIndex = -1;
        this.removeBorderHeaderStyle(e === null, index, rowIndex);
        if (index === 5 && this.removeIconItem.isLeftHovering) {
          this.removeIconItem.isLeftHovering = false;
          return;
        }
        if (
          index !== 5 &&
          this.oppoLineItemFieldMembers[index].isLeftHovering
        ) {
          this.oppoLineItemFieldMembers[index].isLeftHovering = false;
          return;
        }
        if (
          index !== 5 &&
          this.oppoLineItemFieldMembers[index].isRightHovering
        ) {
          this.oppoLineItemFieldMembers[index].isRightHovering = false;
        }
      }
    }
  }

  handleMouseLeave() {
    if (this.currentHoveredIndex !== -1) {
      this.removeBorderHeaderStyle(false, this.currentHoveredIndex);
      if (this.currentHoveredIndex === 5) {
        this.removeIconItem.isLeftHovering = false;
      } else {
        this.oppoLineItemFieldMembers[this.currentHoveredIndex].isLeftHovering =
          false;
        this.oppoLineItemFieldMembers[
          this.currentHoveredIndex
        ].isRightHovering = false;
      }
    }
  }

  handleMouseDownOnHeaders(eDown) {
    this.handleMouseDown(eDown, {
      whichPart: "header",
      borderScope: borderThresholdOnHeader
    });
  }

  handleMouseDownOnWrapper(eDown) {
    this.handleMouseDown(eDown, {
      whichPart: "wrapper",
      borderScope: borderThresholdOnWrapper
    });
  }
  handleMouseDownFromChildCmp(e) {
    const { columnIndex, clientX, rowIndex } = JSON.parse(e.detail);
    this.handleMouseDown(null, {
      whichPart: "childCmp",
      borderScope: borderThresholdOnWrapper,
      columnIndex,
      clientX,
      rowIndex
    });
  }
  isInitialRun = true;
  preventClick = false;
  isLeftBorder = false;
  goLeft;
  handleMouseDown(eDown, payload) {
    //if it is called by handleMouseDownFromChildCmp, eDown is null;
    // if it is called by handleMouseDownOnHeaders or handleMouseDownOnWrapper, columnIndex, clientX, rowIndex are undefined
    const { whichPart, borderScope, columnIndex, clientX, rowIndex } = payload;
    this.preventClick = false;
    let index;
    if (whichPart === "header") {
      index = +eDown.target.dataset.index;
    }
    if (whichPart === "wrapper") {
      index = +eDown.target.dataset.wrapperIndex;
    }
    if (whichPart === "childCmp") {
      index = columnIndex;
    }
    if (index >= 0 && index <= 5) {
      let fieldDiv = this.template.querySelector(`[data-index="${index}"]`);
      const clientXValue = whichPart === "childCmp" ? clientX : eDown.clientX;
      const rect =
        whichPart === "childCmp"
          ? fieldDiv.getBoundingClientRect()
          : eDown.target.getBoundingClientRect();
      if (eDown !== null) {
        if (!eDown.target.style.cursor) {
          return;
        }
        if (
          ![
            "orderNumItem",
            "item",
            "removeIconItem",
            "orderNumItemWrapper",
            "itemWrapper",
            "removeIconItemWrapper"
          ].includes(eDown.target.className)
        ) {
          return;
        }
      }
      let mouseX = clientXValue - rect.left;
      //Check if the mouse is within `borderScope` pixels from the left border
      this.isLeftBorder = mouseX < borderScope ? true : false;

      // don't need to take account of resizing on the left border and index is 0 which is product name field,
      // because the cursor style will never be col-resize

      if (this.isLeftBorder) {
        index = index - 1;
        fieldDiv = this.template.querySelector(`[data-index="${index}"]`);
      }
      const fieldWrapperDiv = this.template.querySelector(
        `[data-wrapper-index="${index}"]`
      );
      const page2Div = this.template.querySelector(".page2");
      const orderNumItemDiv = this.template.querySelector(".orderNumItem");
      const itemsDiv = this.template.querySelector(".items");
      const itemsWrapperDiv = this.template.querySelector(".itemsWrapper");
      const footingDiv = this.template.querySelector(".footing");
      const headerDiv = this.template.querySelector(".header");
      if (this.isInitialRun) {
        document.documentElement.style.setProperty(
          "--restItemSize",
          orderNumItemDiv.offsetWidth + "px"
        );
        document.documentElement.style.setProperty(
          "--itemsWidth",
          itemsDiv.offsetWidth + "px"
        );
        document.documentElement.style.setProperty(
          "--itemWidth",
          fieldDiv.offsetWidth + "px"
        );
        this.template
          .querySelectorAll("c-product-line-item")
          .forEach((e) => e.updateWidthToPixels());
        this.isInitialRun = false;
      }

      this.oppoLineItemFieldMembers[index].lastMouseX = clientXValue;
      this.oppoLineItemFieldMembers[index].isResizing = true;
      const handleMouseMoveOnHeader = (eMove) => {
        if (!this.oppoLineItemFieldMembers[index].isResizing) {
          document.removeEventListener("mousemove", handleMouseMoveOnHeader);
          return;
        }
        const minWidthLongNum = parseInt(
          document.documentElement.style.getPropertyValue("--minWidthLong"),
          10
        );
        this.goLeft = eMove.movementX <= 0 ? true : false;
        if (fieldDiv.offsetWidth === minWidthLongNum && this.goLeft) {
          let minPage2Width = 0;
          let minItemsWidth = 0;
          for (const div of this.template.querySelectorAll("[data-index]")) {
            if (+div.dataset.index !== index) {
              minPage2Width += div.offsetWidth;
              if (div.dataset.column !== "removeIconItem") {
                minItemsWidth += div.offsetWidth;
              }
            }
          }
          minPage2Width += minWidthLongNum + orderNumItemDiv.offsetWidth;
          minItemsWidth += minWidthLongNum;
          itemsDiv.style.width = minItemsWidth + "px";
          itemsWrapperDiv.style.width = itemsDiv.style.width;
          page2Div.style.width = minPage2Width + "px";
          footingDiv.style.width = page2Div.style.width;
          headerDiv.style.width = page2Div.style.width;

          console.log("fieldDiv.offsetWidth", fieldDiv.offsetWidth);
          document.removeEventListener("mousemove", handleMouseMoveOnHeader);
          return; //stop shrinking cell
        }
        console.log("eMove.movementX", eMove.movementX);
        console.log(this.goLeft);
        console.log("fieldDiv.className", fieldDiv.className);
        console.log("fieldDiv.offsetWidth", fieldDiv.offsetWidth);
        const deltaX =
          eMove.clientX - this.oppoLineItemFieldMembers[index].lastMouseX;
        const fieldDivNewWidth = fieldDiv.offsetWidth + deltaX;
        fieldDiv.style.width = fieldDivNewWidth + "px";
        fieldWrapperDiv.style.width = fieldDiv.style.width;

        itemsDiv.style.width = itemsDiv.offsetWidth + deltaX + "px";
        itemsWrapperDiv.style.width = itemsDiv.style.width;
        page2Div.style.width = page2Div.offsetWidth + deltaX + "px";
        footingDiv.style.width = page2Div.style.width;
        headerDiv.style.width = page2Div.style.width;

        this.oppoLineItemFieldMembers[index].resizedWidth =
          fieldDiv.style.width;
        this.oppoLineItemFieldMembers[index].lastMouseX = eMove.clientX;
      };
      const handleMouseUpOnHeader = () => {
        if (this.oppoLineItemFieldMembers[index].isResizing) {
          this.oppoLineItemFieldMembers[index].isResizing = false;
          this.preventClick = true;
          if (whichPart === "childCmp") {
            if (this.isLeftBorder) {
              this.removeBorderHeaderStyle(true, index + 1, rowIndex);
            } else {
              this.removeBorderHeaderStyle(true, index, rowIndex);
            }
          } else {
            if (this.isLeftBorder) {
              this.removeBorderHeaderStyle(false, index + 1);
            } else {
              this.removeBorderHeaderStyle(false, index);
            }
          }
          this.currentHoveredIndex = -1;
          document.removeEventListener("mousemove", handleMouseMoveOnHeader);
          document.removeEventListener("mouseup", handleMouseUpOnHeader);
        }
      };
      window.addEventListener("mousemove", handleMouseMoveOnHeader);
      window.addEventListener("mouseup", handleMouseUpOnHeader);
    }
  }
}
