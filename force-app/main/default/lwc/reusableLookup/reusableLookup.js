/* eslint-disable */
import { LightningElement, api, track } from "lwc";
import fetchRecords from "@salesforce/apex/ReusableLookupController.fetchRecords";

import { debounce } from "c/utilities";
/** The delay used when debouncing event handlers before invoking Apex. */
const DELAY = 500;

export default class ReusableLookup extends LightningElement {
  @api placeholder = "Search Products...";
  @api required;
  @api selectedIconName;
  @api sourceData;

  @api objectApiName;
  @api fieldApiNames;
  @api filterFieldApiName;
  @api mainFilter;
  @api oppoId;
  @api sortByFiled;
  noFilter = false;

  @track recordsList = [];
  selectedRecordName;

  searchString = "";
  @api parentRecordId;
  @api parentFieldApiNames;
  @api topNum = "3";

  @api checkedPricebookEntryIds;
  @track
  rerenderConditionObject = {
    isTopRecord: false,
    handleChanged: false
  };

  @track
  flexItemTitleDivs;

  get showRecords() {
    if (this.recordsList.length > 1 || this.searchString.length > 1) {
      return true;
    }
    return false;
  }

  get showSearchLi() {
    return this.searchString.length > 1;
  }

  get methodInput() {
    return {
      objectApiName: this.objectApiName,
      fieldApiNames: this.fieldApiNames,
      filterFieldApiName: this.filterFieldApiName,
      mainFilter: this.mainFilter,
      noFilter: this.noFilter,
      sortByFiled: this.sortByFiled,
      oppoId: this.oppoId,
      searchString: this.searchString,
      topNum: this.topNum,
      checkedRecordIds: [...this.checkedPricebookEntryIds]
    };
  }

  setValueBack() {
    this.searchString = "";
    this.recordsList = [];
    this.currentLi = -1;
    this.currentMousePointedLiDiv = null;
  }
  updateLiTags() {
    for (const key in this.rerenderConditionObject) {
      if (this.rerenderConditionObject[key]) {
        this.flexItemTitleDivs =
          this.template.querySelectorAll(".flexItemTitle");
        if (this.recordsList.length > 0) {
          this.rerenderConditionObject[key] = false;
          for (let i = 0; i < this.recordsList.length; i++) {
            let div = this.flexItemTitleDivs[i];
            let rec = this.recordsList[i];
            if (key === "isTopRecord") {
              div.innerHTML = rec.Product2.Name;
            }
            if (key === "handleChanged") {
              div.innerHTML = rec.Product2.Name.replaceAll(
                new RegExp(this.searchString, "gi"),
                (subStr) => {
                  return "<b>" + subStr + "</b>";
                }
              );
            }
          }
        }
      }
    }
  }

  renderedCallback() {
    this.updateLiTags();
  }

  getTopRecords() {
    let inputValue = this.template.querySelector("input").value;
    if (inputValue.trim().length === 0) {
      this.noFilter = true;
      this.rerenderConditionObject.isTopRecord = true;
      this.debouncedFetch();
    }
    if (inputValue.length > 0) {
      this.searchString = inputValue;
      this.rerenderConditionObject.handleChanged = true;
      if (this.recordsListClone?.length > 0) {
        this.recordsList = this.recordsListClone;
        this.recordsListClone = null;
      } else if (this.oneRecordChecked && inputValue.length > 1) {
        this.noFilter = false;
        this.debouncedFetch();
      }
    }
    this.oneRecordChecked = false;
  }

  fetchSobjectRecords() {
    fetchRecords({
      inputWrapper: this.methodInput
    })
      .then((result) => {
        this.recordsList = JSON.parse(JSON.stringify(result));
      })
      .catch((error) => {
        throw error;
      });
  }

  debouncedFetch = debounce(this.fetchSobjectRecords, DELAY);
  //handler for calling apex when user change the value in lookup
  handleChange(e) {
    this.searchString = e.target.value;
    this.recordsList = [];
    this.recordsListClone && (this.recordsListClone = null);
    if (this.searchString.length > 1) {
      this.noFilter = false;
      this.rerenderConditionObject.handleChanged = true;
      this.debouncedFetch();
    } else {
      if (this.searchString.length === 0) {
        this.dispatchEvent(new CustomEvent("searchall"));
      }
      this.setValueBack();
    }
  }

  //input box blur event handler
  handleInputBlur() {
    this.recordsListClone = this.recordsList;
    this.setValueBack();
  }

  //handler for clicking outside the selection panel
  selectionPanelBlurHandler() {
    this.setValueBack();
  }

  preventInputboxBlurEvent(event) {
    //in order to prevent inputbox blur event
    event.preventDefault();
  }

  handleEnterKeyPress(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (this.currentLi !== -1) {
        let liDivs = this.template.querySelectorAll(".liDiv");
        //if it is Search term Li
        if (liDivs[this.currentLi].dataset.id === undefined) {
          this.searchStrClickHandler();
        } else {
          let selectedRecordId = liDivs[this.currentLi].dataset.id;
          this.sendRecordIdToParent(selectedRecordId);
          this.oneRecordChecked = true;
        }
      }
    }
  }

  currentLi = -1;
  //Arrow keys are only triggered by onkeydown, not onkeypress
  NavigateListItems(event) {
    //ArrowUp ArrowDown
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      let liDivs = this.template.querySelectorAll(".liDiv");
      if (liDivs.length > 0) {
        //remove selected class from previous liDiv
        liDivs[this.currentLi] &&
          liDivs[this.currentLi].classList.remove("selected");
        if (event.key === "ArrowDown") {
          this.currentLi =
            this.currentLi < liDivs.length - 1 ? ++this.currentLi : 0;
          liDivs[this.currentLi].classList.add("selected");
        }
        if (event.key === "ArrowUp") {
          this.currentLi =
            this.currentLi <= 0 ? liDivs.length - 1 : --this.currentLi;
          liDivs[this.currentLi].classList.add("selected");
        }
        if (
          this.currentMousePointedLiDiv &&
          this.currentMousePointedLiDiv === liDivs[this.currentLi] &&
          liDivs[this.currentLi].style.backgroundColor === "white"
        ) {
          liDivs[this.currentLi].style.removeProperty("background-color");
        } else if (
          this.currentMousePointedLiDiv &&
          this.currentMousePointedLiDiv !== liDivs[this.currentLi] &&
          this.currentMousePointedLiDiv.style.backgroundColor !== "white"
        ) {
          this.currentMousePointedLiDiv.style.backgroundColor = "white";
        }
      }
    }
  }
  currentMousePointedLiDiv;
  handleMouseEnterLi(event) {
    //remove previous currentMousePointedLiDiv background-color style
    this.currentMousePointedLiDiv?.style.backgroundColor === "white" &&
      this.currentMousePointedLiDiv.style.removeProperty("background-color");
    this.currentMousePointedLiDiv = event.currentTarget;
    let liDivs = this.template.querySelectorAll(".liDiv");
    //if it is Search term Li
    if (this.currentMousePointedLiDiv.dataset.index === undefined) {
      this.currentLi = 0;
    } else if (
      this.currentMousePointedLiDiv.dataset.index &&
      this.template.querySelector(".searchTermBar")
    ) {
      this.currentLi = +this.currentMousePointedLiDiv.dataset.index + 1;
    } else if (
      this.currentMousePointedLiDiv.dataset.index &&
      !this.template.querySelector(".searchTermBar")
    ) {
      this.currentLi = this.currentMousePointedLiDiv.dataset.index;
    }
    for (const liDiv of liDivs) {
      if (liDiv !== this.currentMousePointedLiDiv) {
        liDiv.classList.contains("selected") &&
          liDiv.classList.remove("selected");
      }
    }
  }

  handleLeaveDropDownList() {
    !this.currentMousePointedLiDiv?.classList.contains("selected") &&
      this.currentMousePointedLiDiv?.classList.add("selected");
  }

  searchStrClickHandler() {
    if (this.searchString.length > 1) {
      const searchEvent = new CustomEvent("search", {
        detail: this.searchString
      });
      this.dispatchEvent(searchEvent);
      this.setValueBack();
    }
  }

  oneRecordChecked = false;
  //handler for selection of records from lookup result list
  handleSelect(event) {
    let selectedRecordId = event.currentTarget.dataset.id;
    this.sendRecordIdToParent(selectedRecordId);
    this.oneRecordChecked = true;
  }

  sendRecordIdToParent(selectedRecordId) {
    this.setValueBack();
    const selectedEvent = new CustomEvent("recordselected", {
      detail: selectedRecordId
    });
    this.dispatchEvent(selectedEvent);
  }
}
