import { LightningElement, api, track} from 'lwc';
// import {borderThresholdOnWrapper} from "c/addProductButton"
//pricebookEntry:
// PricebookEntryId: "01u4x000005HwosAAC"
// PricebookEntryProduct2Id: "01t4x0000026uT0AAI"
// PricebookEntryUnitPrice: 85000
// Product2Id: "01t4x0000026uT0AAI" key
// Product2Name: "Installation: Industrial - High"
// Product2NameUrl: "/01t4x0000026uT0AAI"
// Product2ProductCode: "IN7080"
// Quantity: if any input value
// UnitPrice: if any input value
// ServiceDate: if any input value
// Description: if any input value

//oppoLineItemFieldMembers:
//  customFieldMember:[label=Product ID, name=Product2Id, objectName=OpportunityLineItem, type=REFERENCE, required = false],
//  customFieldMember:[label=Quantity, name=Quantity, objectName=OpportunityLineItem, type=DOUBLE, required = true],
//  customFieldMember:[label=Sales Price, name=UnitPrice, objectName=OpportunityLineItem, type=CURRENCY, required = true],
//  customFieldMember:[label=Date, name=ServiceDate, objectName=OpportunityLineItem, type=DATE, required = false],
//  customFieldMember:[label=Line Description, name=Description, objectName=OpportunityLineItem, type=STRING, required = false]
//  customFieldMember:[label=Product Name, name=Product2Name, objectName=Product2, type=STRING, required = false]

//this.objOfData:
// {"Product2Name": {
//     "name": "GenWatt Diesel 1000kW",
//     "id": "/01t4x0000026uT6AAI"
// },
// "Quantity": {
//     "value": "",
//     "numberString": "",
//     "type": "DOUBLE",
//     "required": true,
//     "requiredWithoutValue": true,
//     "label": "Quantity",
//     "isDescription": false,
//     "isServiceDate": false,
//     "isUnitPrice": false,
//     "isQuantity": true
// },
// "UnitPrice": {
//     "value": 100000,
//     "numberString": "$100,000.00",
//     "type": "CURRENCY",
//     "required": true,
//     "requiredWithoutValue": false,
//     "label": "Sales Price",
//     "isDescription": false,
//     "isServiceDate": false,
//     "isUnitPrice": true,
//     "isQuantity": false
// },
// "ServiceDate": {
//     "value": "",
//     "numberString": "",
//     "type": "DATE",
//     "required": false,
//     "requiredWithoutValue": false,
//     "label": "Date",
//     "isDescription": false,
//     "isServiceDate": true,
//     "isUnitPrice": false,
//     "isQuantity": false
// },
// "Description": {
//     "value": "",
//     "numberString": "",
//     "type": "STRING",
//     "required": false,
//     "requiredWithoutValue": false,
//     "label": "Line Description",
//     "isDescription": true,
//     "isServiceDate": false,
//     "isUnitPrice": false,
//     "isQuantity": false
// }}

//dataForLoop:

// [{
//     "key": "Product2Name",
//     "value": {
//         "name": "GenWatt Diesel 10kW",
//         "id": "/01t4x0000026uSzAAI"
//     }
// },
// {
//     "key": "Quantity",
//     "value": {
//         "value": "",
//         "numberString": "",
//         "type": "DOUBLE",
//         "required": true,
//         "requiredWithoutValue": false,
//         "label": "Quantity",
//         "isDescription": false,
//         "isServiceDate": false,
//         "isUnitPrice": false,
//         "isQuantity": true
//     }
// },
// {
//     "key": "UnitPrice",
//     "value": {
//         "value": 5000,
//         "numberString": "$5,000.00",
//         "type": "CURRENCY",
//         "required": true,
//         "requiredWithoutValue": false,
//         "label": "Sales Price",
//         "isDescription": false,
//         "isServiceDate": false,
//         "isUnitPrice": true,
//         "isQuantity": false
//     }
// },
// {
//     "key": "ServiceDate",
//     "value": {
//         "value": "",
//         "numberString": "",
//         "type": "DATE",
//         "required": false,
//         "requiredWithoutValue": false,
//         "label": "Date",
//         "isDescription": false,
//         "isServiceDate": true,
//         "isUnitPrice": false,
//         "isQuantity": false
//     }
// },
// {
//     "key": "Description",
//     "value": {
//         "value": "",
//         "numberString": "",
//         "type": "STRING",
//         "required": false,
//         "requiredWithoutValue": false,
//         "label": "Line Description",
//         "isDescription": true,
//         "isServiceDate": false,
//         "isUnitPrice": false,
//         "isQuantity": false
//     }
// }]
// const status = {
//     inital: 'inital',
//     clicked: 'clicked',
//     blurred: 'blurred'
// }

const noValueFields = ['orderNumItem','Product2Name','removeIconItem'];
const numberOrCurrencyFields = ['Quantity', 'UnitPrice'];
export const restFields = ['Quantity', 'UnitPrice', 'ServiceDate', 'Description'];
// export {restFields}

export default class ProductLineItem extends LightningElement {
    @api pricebookEntry
    @api oppoId
    @api index
    @api indexRegen
    @api itemHeight
    // @api isLeftRemoveIconItemHovering
    // @api isRemoveIconItemClicked
    @api removeIconItem
    @api restItemSize
    // orderNumber ;
    // @track objOfData = {};

    /**
     * lastHighlightedCell = {column: 0, index: 0,}
     * index is for row index, column is the key of rowMap
     */
    currentHighlightedCell = {};
    // columnMap = {
    //     0: {column: 'orderNumItem'},
    //     1: {column: 'Product2Name'},
    //     2: {column: 'Quantity'},
    //     3: {column: 'UnitPrice'},
    //     4: {column: 'ServiceDate'},
    //     5: {column: 'Description'},
    //     6: {column: 'removeIconItem'}
    // }
    // columnMap = {};
    // @track rowMap = {
    //     orderNumItem: {key: 0},
    //     Product2Name: {name: 'Product2Name', id: 'Product2Id', key: 1},
    //     Quantity: {value: '', isDescription: false, isServiceDate: false, isUnitPrice: false, isQuantity: true, isUpdated: false, key: 2},
    //     UnitPrice: {name: 'PricebookEntryUnitPrice',  value:'', isDescription: false, isServiceDate: false, isUnitPrice: true, isQuantity: false, isUpdated: false, key: 3},
    //     ServiceDate: {value: '',  isDescription: false, isServiceDate: true, isUnitPrice: false, isQuantity: false, isUpdated: false, key: 4},
    //     Description: {value: '',  isDescription: true, isServiceDate: false, isUnitPrice: false, isQuantity: false, isUpdated: false, key: 5},
    //     removeIconItem: {key: 6}
    // }


    @track
    rowMap = {
        orderNumItem: {key: 0},
        Product2Name: {name: 'Product2Name', id: 'Product2Id', key: 1},
        Quantity: {value: '', isDescription: false, isServiceDate: false, isUnitPrice: false, isQuantity: true, isUpdated: false, key: 2},
        UnitPrice: {name: 'PricebookEntryUnitPrice',  value:'', isDescription: false, isServiceDate: false, isUnitPrice: true, isQuantity: false, isUpdated: false, key: 3},
        ServiceDate: {value: '',  isDescription: false, isServiceDate: true, isUnitPrice: false, isQuantity: false, isUpdated: false, key: 4},
        Description: {value: '',  isDescription: true, isServiceDate: false, isUnitPrice: false, isQuantity: false, isUpdated: false, key: 5},
        removeIconItem: {key: 6}
    }

    // @api
    // get rowMap() {
    //     return this._rowMap;
    // }

    // _oppoLineItemFieldMembers;

    // @api
    // get oppoLineItemFieldMembers() {
    //     return this._oppoLineItemFieldMembers;
    // }
    // set oppoLineItemFieldMembers(v) {
    //     // for (const oppoLineItem of v) {
    //     //     if (oppoLineItem.lastMouseX !== null) {

    //     //     }
    //     // }
    //     this._oppoLineItemFieldMembers = v;
    // }
    @api oppoLineItemFieldMembers;
    _isInitialRun;

    // @api
    // get isInitialRun() {
    //     return this._isInitialRun;
    // }
    // @api itemHeaderWidth;
    // runOneTime = true;
    // set isInitialRun(value) {
    //     if (!value && this.runOneTime) {
    //         if (document.documentElement.style.getPropertyValue('--itemWidth')) {
    //             //this var(--itemWidth) css variable id passed from the parent component,
    //             //since this variale was created under document object in the parent,
    //             //the child component use the same document object
    //             const itemWidth = document.documentElement.style.getPropertyValue('--itemWidth');
    //             document.documentElement.style.setProperty('--widthOfItem', itemWidth);
    //         }
    //         if (!document.documentElement.style.getPropertyValue('--itemHeight')) {
    //             document.documentElement.style.setProperty('--itemHeight', this.itemHeight);
    //         }
    //         if (!document.documentElement.style.getPropertyValue('--restItemSize')) {
    //             document.documentElement.style.setProperty('--restItemSize', this.restItemSize);
    //         }
    //         this.runOneTime = false;
    //     }
    //     this._isInitialRun = value;
    // }
    beforeRunning = true;
    @api
    updateWidthToPixels(){
        if (this.beforeRunning) {
            if (document.documentElement.style.getPropertyValue('--itemWidth')) {
                //this var(--itemWidth) css variable id passed from the parent component,
                //since this variale was created under document object in the parent,
                //the child component use the same document object
                const itemWidth = document.documentElement.style.getPropertyValue('--itemWidth');
                document.documentElement.style.setProperty('--widthOfItem', itemWidth);
            }
            if (!document.documentElement.style.getPropertyValue('--itemHeight')) {
                document.documentElement.style.setProperty('--itemHeight', this.itemHeight);
            }
            if (!document.documentElement.style.getPropertyValue('--restItemSize')) {
                document.documentElement.style.setProperty('--restItemSize', this.restItemSize);
            }
            this.beforeRunning = false;
        }
    }

    @api
    get objOfData(){
        let result = {};
        for (const e of this.oppoLineItemFieldMembers) {
            // if(rowMap[e.name] || rowMap[e.name] === ''){
            if(this.rowMap[e.name]){
                if (e.name === 'Product2Name') {
                    result[e.name] = {name: this.pricebookEntry[this.rowMap[e.name].name],
                                      id: '/' + this.pricebookEntry[this.rowMap[e.name].id],
                                    //   lastMouseX: e.lastMouseX
                                    }
                } else{
                    result[e.name] = {
                        value: this.rowMap[e.name].value ? this.rowMap[e.name].value : '',
                        numberString: this.rowMap[e.name].value ? this.convertFormat(this.rowMap[e.name].value, e.type) : '',
                        type: e.type,
                        required: e.required,
                        requiredWithoutValue: (e.required && this.rowMap[e.name].value === '') ? true : false,
                        label: e.label,
                        isDescription: this.rowMap[e.name].isDescription,
                        isServiceDate: this.rowMap[e.name].isServiceDate,
                        isUnitPrice: this.rowMap[e.name].isUnitPrice,
                        isQuantity: this.rowMap[e.name].isQuantity,
                        // lastMouseX: e.lastMouseX
                        // value: this.rowMap[e.name].value ? this.rowMap[e.name].value :
                        //              (this.rowMap[e.name].isUnitPrice ? this.pricebookEntry[this.rowMap[e.name].name] : ''),
                        // numberString: this.rowMap[e.name].value ? this.convertFormat(this.rowMap[e.name].value, e.type) :
                        //               (this.pricebookEntry[this.rowMap[e.name].name] ?
                        //                this.convertFormat(this.pricebookEntry[this.rowMap[e.name].name], e.type) : ''),
                    }
                }
                //update field's width when resizing
                if (!this.beforeRunning && e.resizedWidth !== null ) {
                    const currFieldDiv = this.template.querySelector(`[data-column="${e.name}"]`);
                    currFieldDiv.style.width = e.resizedWidth;
                }
            }
        }
        return result;
    }

    get dataForLoop() {
        return this.objOfData ? Object.entries(this.objOfData).map(([key,value])=>({ key, value })) : [];
    }



    get orderNumber(){
        const orderNo = (this.indexRegen !== undefined ? this.indexRegen : this.index) + 1;
        return orderNo;
    }
    // currentStatus = status.inital;

    get errorMessage(){
        return 'Item ' + this.orderNumber + ' has errors.';
    }

    connectedCallback(){

        for (const f of restFields) {
            this.rowMap[f].value = this.pricebookEntry[f] ? this.pricebookEntry[f] : '';
        }
        // this.orderNumber = this.index + 1;

        if (!document.documentElement.style.getPropertyValue('--numOfItems')) {
            document.documentElement.style.setProperty('--numOfItems', this.oppoLineItemFieldMembers.length);
        }
        const widthOfItem = (100 - 2 * parseFloat(this.restItemSize)) / this.oppoLineItemFieldMembers.length + '%';
        document.documentElement.style.setProperty('--widthOfItem', widthOfItem);

        if (!document.documentElement.style.getPropertyValue('--itemHeight')) {
            document.documentElement.style.setProperty('--itemHeight', this.itemHeight);
        }

        if (!document.documentElement.style.getPropertyValue('--restItemSize')) {
            document.documentElement.style.setProperty('--restItemSize', this.restItemSize);
        }

    //    Object.keys(this.rowMap).forEach( key => {
    //         const obj = {};
    //         obj.column = key;
    //         this.columnMap[this.rowMap[key].key] = obj;
    //    })

        //assign rowMap values from pricebookEntry record
        this.rowMap.UnitPrice.value = this.pricebookEntry[this.rowMap.UnitPrice.name];
    }

    convertFormat(originalValue, type){
            if (type === 'CURRENCY') {
                return '$' + originalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }else if(type === 'DOUBLE'){
                return originalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }
            else if (type === 'STRING'){
                return originalValue;
            }
            else if (type === 'DATE') {
                let p = originalValue.split(/\D/g);
                return [p[1],p[2],p[0] ].join("/");
            }
            return originalValue;
    }

    clickOnDiffierentCell(currentColumn, currentIndex){
        // return JSON.stringify(this.previousHighlightedCell) === '{}' ||
        return (JSON.stringify(this.previousHighlightedCell) !== '{}' &&
                   (this.previousHighlightedCell.column !== currentColumn ||
                   this.previousHighlightedCell.index !== currentIndex))
    }


    @api previousHighlightedCell
    @api previousHighlightedCellDiv
    updateCurrentHightlightedCell(column,index){
        //set values for column and index properties of currentHighlightedCell
        this.currentHighlightedCell = {column:column,index:index};
       
        if(column === null && index === null) {
            this.currentHighlightedCell = {};
        }
    }
    registerClickFieldEvent(){
        const currentHighlightedCellStr = JSON.stringify(this.currentHighlightedCell);
        const clickField = new CustomEvent("clickfield", { detail: currentHighlightedCellStr});
        this.dispatchEvent(clickField);
    }

    getCurrentDiv(event, fn, ...args){
        const currentDiv = event.currentTarget;
        const div = event.target;
        //top level divs under container div
        let divs = currentDiv.querySelectorAll('.container > div');
        //top div of each field
        divs.forEach(d => {
            //now d is top level divs for current field, and add css styles to the div
            if (d.contains(div)) {
                fn.apply(this, [d, ...args]);
            }
        });
    }

    @api clickedSaveButton;
    //clickField method is for add styling to the clickec cell
    //click on the highest layer of Div Container
    clickField(event){
        if (this.preventClick) {
            return;
        }
        event.stopPropagation();
        //hide any highlights from headers
        const hideHeaderBordersEvent = new CustomEvent("hideheaderborder");
        this.dispatchEvent(hideHeaderBordersEvent);

        this.getCurrentDiv(event,(div) => {
            const currentIndex = this.index;
            const currentColumn = div.dataset.column;
            //if there is previous clicked field, and it has a visible inputbox, and the current clicked  cell is same as the previous clicked cell, then return, do nothing
            if (JSON.stringify(this.previousHighlightedCell) !== '{}'
                && this.isInputboxVisible(this.previousHighlightedCellDiv)
                && !this.clickOnDiffierentCell(currentColumn, currentIndex)) {
                return;
            }
            //if there is a previous clicked field, and it doesn't have a visible inputbox, and the current clicked  cell is same as the previous clicked cell
            if (JSON.stringify(this.previousHighlightedCell) !== '{}'
                && !this.isInputboxVisible(this.previousHighlightedCellDiv)
                && !this.clickOnDiffierentCell(currentColumn, currentIndex)) {
                    this.showInputbox(div);
                    return;
            }
            //if the current click cell falls in noValueFields list, i.e. 'orderNumItem','Product2Name', or 'removeIconItem' column,
            // and when there is a previous clickec cell, and the it has a visible inputbox
            if (noValueFields.includes(currentColumn)
                && JSON.stringify(this.previousHighlightedCell) !== '{}'
                && this.isInputboxVisible(this.previousHighlightedCellDiv)) {
                    this.updateCurrentHightlightedCell(this.previousHighlightedCell.column,this.previousHighlightedCell.index);
                } else {
                //if current clicked cell falls on the column of 'Quantity', 'UnitPrice', 'ServiceDate', or 'Description'
                if (div.querySelector('.restFields') ) {
                    this.showInputbox(div);
                }
                //if current clicked cell falls on any column of 'Quantity', 'UnitPrice', 'ServiceDate', 'Description',
                //and  'orderNumItem','Product2Name', 'removeIconItem'
                if (noValueFields.includes(currentColumn) || div.querySelector('.restFields')) {
                    if (!(this.clickedSaveButton && div.style.border === '3px solid rgb(168, 100, 3)')) {
                        this.addBorder(div);
                    }
                    this.showIcon(div);
                    this.updateCurrentHightlightedCell(currentColumn,currentIndex);
                }
            }
            this.registerClickFieldEvent();
        })
    }

    registerCustomMouseEvent(event, div, customEventName) {
        const columnIndex = +div.dataset.index;
        const clientX = event.clientX;
        const detail = {columnIndex: columnIndex, 
                        clientX: clientX, 
                        rowIndex: this.index};
        // const column = div.dataset.column;
        // orderNumItem div's column index is undefined
        if (columnIndex !== undefined) {
            const mouseMove = new CustomEvent(customEventName, {detail: JSON.stringify(detail)});
            this.dispatchEvent(mouseMove);
        }
    }

    handleMouseMove(e){
        this.getCurrentDiv(e,(div) => this.registerCustomMouseEvent(e, div, "custommousemove"))
    }

    // preventClick = false;
    // updatePreventClickToTrue(value){
    //     this.preventClick = value;
    // }
    

    @api preventClick;
    handleMouseDown(eDown){
        this.getCurrentDiv(eDown,(div) => {
            // this.preventClick = false;
            // cursorStyle is either '' or 'col-resize'
            if (div.style?.cursor) {
                this.registerCustomMouseEvent(eDown, div, "custommousedown")
            }
        })
    }

    @api
    updateCursorOnMouseMove(columnIndex){
        const fieldDiv = this.template.querySelector(`[data-index='${columnIndex}']`);
        fieldDiv.style.cursor= "col-resize";
    }

    @api
    removeCursorStyleOnMouseMove(columnIndex){
        const fieldDiv = this.template.querySelector(`[data-index='${columnIndex}']`);
        fieldDiv.style.cursor= null;
    }

// 'orderNumItem'},
// 'Product2Name'},
// 'Quantity'},
// 'UnitPrice'},
// 'ServiceDate'},
// 'Description'},
// 'removeIconItem'}
//unhighlightPreviousClickedCell method is for remove the styles from the previous clicked cell
    @api
    unhighlightPreviousClickedCell(previousColumn, currentHighlightedCell){
        this.currentHighlightedCell = {...currentHighlightedCell};
        const previousDiv = this.template.querySelector(`[data-column='${previousColumn}']`);
            //for unhighlighting Quantity, UnitPrice, ServiceDate and Description fields,
            //if you click at orderNumItem, Product2Name and removeIconItem fields, need two steps
            // 1st step hide inputbox, 2nd step remove cell's border and icon
            // when you click on Quantity, UnitPrice, ServiceDate andDescription fields,
            // you will hide inputbox, remove cell's border and icon at one time
            //so hiding inputbox will happen for sure, handle it in the code first
            this.hideInputBox(previousDiv);
            //if the current click cell falls in noValueFields list, i.e. 'orderNumItem','Product2Name', or 'removeIconItem' column,
            //Or if the previous clicked cell is different with the current clicked cell, and the current clicked div is 'Quantity', 'UnitPrice', 'ServiceDate', or 'Description' field div
            if (noValueFields.includes(this.currentHighlightedCell.column) ||
                (JSON.stringify(this.currentHighlightedCell) !== JSON.stringify(this.previousHighlightedCell) &&
                 (this.template.querySelector(`[data-column='${this.currentHighlightedCell.column}']`)).querySelector('.restFields'))) {
                    this.updateBorderAndHideIcon(previousColumn, previousDiv);
                return;
            }
            //when Quantity, UnitPrice, ServiceDate or Description is highlighted with input box, then the user click on 'orderNumItem','Product2Name','removeIconItem'
            //at this moment, the currentHighlightedCell equals to previousHighlightedCell
            //becasue the  Quantity, UnitPrice, ServiceDate or Description is still highlighted, just no visible input box
            if (JSON.stringify(this.currentHighlightedCell) === JSON.stringify(this.previousHighlightedCell)) {
                this.hideInputBox(previousDiv);
            }
    }

    @api
    handleBlur(){
        let divs = [...(this.template.querySelectorAll('.container > div'))];
        divs.forEach(d => {
            this.unhighlightOneDiv(d);
        })
    }
    // cellUpdated = false;

    handleNumberInput(){
        // if (!this.cellUpdated) {
        //     this.cellUpdated = true;
        // }

        // const lightningInput = this.template.querySelector("[data-column='ServiceDate'] lightning-input");


        // event.stopPropagation();
        // const inputValue = event.target.value;
        // const dataType = event.target.type;
        // let replaced = '';
        // if (dataType === 'text'){
        //     replaced = inputValue.replace(/[^0-9,.]/g, '') // Remove all characters except numbers, commas, and dots
        //     const indexOfDot = replaced.indexOf(".");

        //     if (indexOfDot !== -1) {
        //         replaced= replaced.substr(0, indexOfDot + 1) + replaced.substr(indexOfDot + 1).replace(/[.,]/g, "");
        //     }
        //     let decimalIndex = replaced.indexOf('.');
        //     if (decimalIndex !== -1 && replaced.length - decimalIndex > 3) {
        //         replaced = replaced.slice(0, decimalIndex + 3);
        //     }
        // }
        // if (dataType === 'date') {
        //     // event.target.setCustomValidity('Invalid data type.');
        //     // event.target.reportValidity();
        //     replaced = inputValue.replace(/[^1-9/]/g, '') // Remove all characters except numbers, commas, and dots
        // }
        // event.target.value = replaced;
    }

    handleEnterKeyPressForNumber(event){
        if (event.key === "Enter") {
            this.processNumber(event);
        }
    }

    handleBlurForNumber(event){
            this.processNumber(event);
    }

    processNumber(event){
        const inputValue = event.currentTarget.value;
        const dataType = event.currentTarget.type;
        let replaced = '';
        // if (this.cellUpdated && inputValue) {
        if (inputValue) {
            if (dataType === 'text' && numberOrCurrencyFields.includes(this.currentHighlightedCell.column)) {
                replaced = inputValue.replace(/[$,]/g, '');
                replaced = parseFloat(replaced);
                // Check if the number has exactly two decimal places
                if (!/^\d+\.\d{2}$/.test(replaced.toString())) {
                    replaced = parseFloat(replaced.toFixed(2));
                }
            } else {
                replaced = inputValue
            }
            // if (dataType === 'date') {
                // let p = inputValue.split(/\D/g);
                // replaced = [p[1],p[2],p[0] ].join("/");
                // if (/^(0?[1-9]|1[0-2])\/(0?[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/.test(replaced)            ) {

                // }
            // }
            // if (this.cellUpdated) {
            //     this.cellUpdated = false;
            // }
        }

        let key = event.currentTarget.dataset.key;
        let tableCellDiv = this.template.querySelector(`[data-column='${key}']`);
        // if (replaced === '' && event.key && event.key === "Enter") {
        //     this.hideInputBox(tableCellDiv);
        // }
        if (event.key && event.key === "Enter") {
            this.hideInputBox(tableCellDiv);
        }
        // this.hideInputBox(tableCellDiv);
        if (this.rowMap[key].value !== replaced) {
            this.rowMap[key].value =  replaced;
            this.rowMap[key].isUpdated = true;

            const payload = {index: this.index,
                             column: key,
                             value: replaced}
            const updateRow = new CustomEvent("updaterow", { detail: JSON.stringify(payload)});
            this.dispatchEvent(updateRow);

            if (this.rowMap[key].isUpdated) {
                this.addStyleToUpdatedCell(tableCellDiv);
                this.hideInputBox(tableCellDiv);
                // this.inputblur = true;
                this.registerInputBlurEvent();
            }
        }
    }
    registerInputBlurEvent(){
        const blurFromInput = new CustomEvent("inputblur");
        this.dispatchEvent(blurFromInput);
    }

    // inputblur = false;
    // registerInputBlurEvent(){
    //     const blurFromInput = new CustomEvent("inputblur", { detail: this.inputblur});
    //     this.dispatchEvent(blurFromInput);
    // }
    showIcon(div){
        const iconDiv = div.querySelector('.lockIcon') || div.querySelector('.editIcon');
        if (iconDiv) {
            iconDiv.style.opacity = 1;
        }
    }

    hideIcon(div){
        const iconDiv = div.querySelector('.lockIcon') || div.querySelector('.editIcon');
        if (iconDiv) {
            iconDiv.style.removeProperty('opacity');
        }
    }

    getInputbox(div){
        return div.querySelector('.requiredWithValue') || div.querySelector('.requiredWithNoValue') || div.querySelector('.notRequired')
    }

    showInputbox(div){
        const inputDiv = this.getInputbox(div)
        if (inputDiv) {
            inputDiv.style.visibility = 'visible';
            const inputbox = inputDiv.querySelector('input') || inputDiv.querySelector('lightning-input');
            inputbox.focus();
            const divOnFocus = inputDiv.querySelector('input:focus')
                                || inputDiv.querySelector('input:focus-within')
                                || inputDiv.querySelector('lightning-input:focus')
                                || inputDiv.querySelector('lightning-input:focus-within')
            if (divOnFocus) {
                if (inputDiv.className === 'requiredWithNoValue') {
                    divOnFocus.style.outlineColor = 'red';
                    divOnFocus.style.boxShadow = 'rgb(186, 5, 23) 0px 0px 0px 1px inset';
                }
                // if (inputDiv.className === 'requiredWithValue') {
                if (['requiredWithValue', 'notRequired'].includes(inputDiv.className)) {
                    divOnFocus.style.outlineColor = 'rgb(27, 150, 255)';
                    divOnFocus.style.boxShadow = 'rgb(1, 118, 211) 0px 0px 3px 0px';
                }
                // this.inputblur = true;
                // this.registerInputBlurEvent();
                this.isHeaderStyleBlocked = true;
                this.registerBlockHeaderStyleEvent();
            }
        }
    }
    isHeaderStyleBlocked = false;
    registerBlockHeaderStyleEvent(){
        const blockHeaderStyle = new CustomEvent("blockheaderstyle", { detail: this.isHeaderStyleBlocked});
        this.dispatchEvent(blockHeaderStyle);
    }

    @api
    isInputboxVisible(div){
        const inputDiv =  this.getInputbox(div);
        if (inputDiv) {
            return inputDiv.style.visibility === 'visible'
        }
        return false;
    }

    @api
    hideInputBox(div){
        //if the inputDiv exists, hide it
        if (this.isInputboxVisible(div)) {
            let inputDiv = this.getInputbox(div);
            inputDiv.style.visibility = 'hidden';
            // this.inputblur = false;
            // this.registerInputBlurEvent();
            this.isHeaderStyleBlocked = false;
            this.registerBlockHeaderStyleEvent();
        }
    }

    addBorder(div){
        div.style.border="1px solid rgb(11, 92, 171)";
    }


    removeBorder(div){
        div.style.border = null;
        div.style.borderWidth = null;
    }


    addUpdatedCellBorderToBrown(div){
        div.style.border = "1px solid rgb(168, 100, 3)";
    }

    addStyleToUpdatedCell(div){
        div.style.backgroundColor = "rgb(249, 227, 182)";
        div.style.fontWeight = "bold";
    }


    isCellUpdated(column){
        //check if the cell is updated: check if there is a property named 'isUpdated' and if it's updated
        return Object.prototype.hasOwnProperty.call(this.rowMap[column], 'isUpdated') &&
               this.rowMap[column].isUpdated
    }

    isCellStyled(div){
        return Object.prototype.hasOwnProperty.call(div, 'style')
    }

    @api
    getcurrentHighlightedCell(column){
        return this.template.querySelector(`[data-column='${column}']`);
    }

    @api
    initializeStatus(){
        this.currentHighlightedCell = {};
    }

    @api
    updateBorderAndHideIcon(column,div){
        if (!(this.clickedSaveButton && div.style.border === '3px solid rgb(168, 100, 3)')) {
            this.removeBorder(div);
            //check if the cell is updated: 1st check there is a property named 'isUpdated',
            if (this.isCellUpdated(column)) {
                this.addUpdatedCellBorderToBrown(div);
            }
        }
        this.hideIcon(div);
    }

    deleteRow(){
        if (this.preventClick) {
            return;
        }
        let component = this.template.querySelector('.container');
        component.style.display = 'none';
        const deleteRow = new CustomEvent("deleterow", { detail: this.index});
        this.dispatchEvent(deleteRow);
    }

    showItemErrorMsg(){
        let errorDiv = this.template.querySelector('.errorMessage');
        errorDiv.style.visibility = 'visible';
        let errorIconDive = this.template.querySelector('.errorIcon');
        errorIconDive.style.border = "1px solid rgb(53, 93, 150)";
        errorIconDive.style.boxShadow = "rgb(1, 118, 211) 0px 0px 3px 0px";
        errorIconDive.style.borderRadius = "4px";

    }

    hideItemErrorMsg(){
        this.template.querySelector('.errorMessage').style.visibility = 'hidden';
        let errorIconDive = this.template.querySelector('.errorIcon');
        errorIconDive.style.border = null;
        errorIconDive.style.boxShadow = null;
    }

    @api
    getRequiredFieldsWithoutValue(){
        let rowNumWithIndexAndLabels = {
            rowNumber: this.orderNumber,
            index: this.index,
            labels: []
        }
        for (const f of this.dataForLoop) {
            if (f.value.requiredWithoutValue) {
                rowNumWithIndexAndLabels.labels.push(f.value.label);
            }
        }
        return rowNumWithIndexAndLabels;
    }

    @api
    showErrorIcon(){
        this.template.querySelector('.errorIcon').style.visibility = 'visible';
    }

    @api
    hideErrorIcon(){
        this.template.querySelector('.errorIcon').style.visibility = 'hidden';
    }

    @api
    highlightEmptyCellsWithRed(){
        this.template.querySelectorAll('.item[data-requiredwithoutvalue="true"]').forEach(el => {
            el.style.border = '3px solid rgb(168, 100, 3)'
            this.addStyleToUpdatedCell(el);
    })}

    @api
    removeStylesForAllCells(){
        // this.template.querySelectorAll('.item[data-requiredwithoutvalue="true"]').forEach(el => {
        //     el.style.border = null
        // })
        this.template.querySelectorAll('.item').forEach(el => {
            el.removeAttribute('style')
            this.hideIcon(el);
        })
        this.template.querySelector('.orderNumItem').style.border = null;
        this.template.querySelector('.removeIconItem').style.border = null;
    }

    @api
    hideAllCellIcons(){
        this.template.querySelectorAll('.item').forEach(el => this.hideIcon(el));
    }

    @api
    emptyHighlightedCells (){
        this.currentHighlightedCell = {};
        //empty previousHighlightedCell and previousHighlightedCellDiv variables in Parent component
        const emptyPreviousHighlightedCell = new CustomEvent("emptypreviouscell");
        this.dispatchEvent(emptyPreviousHighlightedCell);
    }

    @api
    removeStylesForRequiredFieldWithValue (div){
        div.removeAttribute('style');
    }
    // returnByRequiredEmptyCell(div){
    //     if (this.clickedSaveButton && div.style.border === '3px solid rgb(168, 100, 3)') {
    //         return;
    //     }
    // }

    // @api
    // removeStyleToUpdatedCell(div){
    //     div.style.backgroundColor = null;
    //     div.style.fontWeight = null;
    // }

    
}