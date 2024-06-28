public with sharing class ReusableLookupController {
    @AuraEnabled (cacheable = true)
    public static List<SObject> fetchRecords(SearchWrapper inputWrapper) {
        try {
            if(inputWrapper != null){
                System.debug(inputWrapper);
                String fieldsToQuery = 'SELECT Id, ';
                if(string.isNotBlank(inputWrapper.fieldApiNames)){
                    fieldsToQuery = fieldsToQuery + inputWrapper.fieldApiNames;
                }
                String query = fieldsToQuery + ' FROM '+ inputWrapper.objectApiName;

                query += ' WHERE ' + inputWrapper.mainFilter + '\'' + String.escapeSingleQuotes(inputWrapper.oppoId) + '\')';

                if (!inputWrapper.checkedRecordIds.isEmpty()) {
                    query +=  ' AND Id NOT IN (\'' + string.join(inputWrapper.checkedRecordIds,'\' , \'') + '\') ';
                }

                if (!inputWrapper.noFilter) {
                    query += ' AND ' + inputWrapper.filterFieldApiName + ' LIKE ' + '\'%' + 
                    String.escapeSingleQuotes(inputWrapper.searchString.trim()) + '%\'';
                }

                query += ' ORDER BY ' + inputWrapper.sortByFiled ;   
                query += ' LIMIT ' + inputWrapper.topNum;
                System.debug('query: '+ query);
                // SELECT Id, Product2.Id, Product2.Name, Product2.ProductCode, PricebookEntry.UnitPrice, Product2.Description, Product2.Family 
                // FROM PricebookEntry WHERE null'0064x00000MkQmKAAV' ORDER BY null LIMIT 3

                // List<ResultWrapper> returnWrapperList = new List<ResultWrapper>();
                // for(SObject s : Database.query(query)) {
                //     ResultWrapper wrap = new ResultWrapper();
                //     wrap.mainField = (String)s.get(inputWrapper.fieldApiName);
                //     wrap.subField = (String)s.get(inputWrapper.otherFieldApiName);
                //     wrap.id = (String)s.get('id');
                //     returnWrapperList.add(wrap);
                // }
                List<SObject> sObjList = Database.query(query);
                return sObjList;
            }
            return null;
        } catch (Exception err) {
            System.debug(err.getStackTraceString());
            throw new AuraHandledException(err.getMessage());
        }
    }

    // public class ResultWrapper{
    //     @AuraEnabled public String mainField{get;set;}
    //     @AuraEnabled public String subField{get;set;}
    //     @AuraEnabled public String id{get;set;}
    // }

    public class SearchWrapper {
        @AuraEnabled public String objectApiName{get;set;}
        @AuraEnabled public String fieldApiNames{get;set;}
        @AuraEnabled public String filterFieldApiName{get;set;}
        @AuraEnabled public String mainFilter{get;set;}
        @AuraEnabled public String sortByFiled{get;set;}
        @AuraEnabled public String oppoId{get;set;}
        @AuraEnabled public String searchString{get;set;}
        @AuraEnabled public Boolean noFilter{get;set;}
        @AuraEnabled public String topNum{get;set;}
        @AuraEnabled public List<String> checkedRecordIds{get;set;}
    }
}
    // get methodInput() {
    //     return {
    //         objectApiName: this.objectApiName,
    //         fieldApiNames: this.fieldApiNames,
    //         filterFieldApiName: this.filterFieldApiName,
    //         mainFilter: this.mainFilter,
    //         noFilter: this.noFilter,
    //         sortByFiled: this.sortByFiled,
    //         oppoId: this.oppoId,
    //         searchString: this.searchString,
    //         topNum: this.topNum
    //     };
    // }