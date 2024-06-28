public with sharing class addProductButtonHandler {
    //public static List<OpportunityLineItem> getOpportunityLineItems(Integer limitSize, Integer offset, String fieldSetName) {
    public class paraWrapper {
        @AuraEnabled
        public String limitSize;
        @AuraEnabled
        public String offset;
        // @AuraEnabled
        // public String fieldSetName;
        @AuraEnabled
        public String fields;
        @AuraEnabled 
        public String oppoId;
        @AuraEnabled
        public List<String> checkedRecordIds;
    }
    public class customFieldMember {
        @AuraEnabled
        public String objectName;
        @AuraEnabled
        public String name; //getFieldPath()
        @AuraEnabled
        public String type; //getType
        @AuraEnabled
        public String label; //getLabel
    }

    public class initData {
        @AuraEnabled
        public List<customFieldMember> fieldMembers;
        @AuraEnabled
        public Integer totalNumberOfRows;
        @AuraEnabled
        public List<PricebookEntry> pricebookEntries;
    }
    // {"paraObj":
    //     {"limitSize":15,
    //     "offset":0,
    //     "fields":"Product2.Id, Product2.Name, Product2.ProductCode, PricebookEntry.UnitPrice, Product2.Description, Product2.Family",
    //     "oppoId":"0064x00000MkQmKAAV"},
    // "filter":"test"}    
    public class paraWrapperWithFilter{
        @AuraEnabled
        public paraWrapper paraWrapper;
        @AuraEnabled
        public string filter;
    }

    public class dataWithTotalLength {
        @AuraEnabled
        public Integer totalNumberOfRows;
        @AuraEnabled
        public List<PricebookEntry> pricebookEntries;
    }

    // SELECT Product2.Name, Product2.ProductCode, PricebookEntry.UnitPrice, Product2.Description, Product2.Family FROM PricebookEntry 
    // WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id =  '0064x00000MkQmKAAV')

    @AuraEnabled (cacheable = true)
    public static initData getInitData (String paraWrapperStr) {
        initData result = new initData();
        paraWrapper p = (paraWrapper) JSON.deserialize(paraWrapperStr, paraWrapper.class);
        result.fieldMembers = getFieldMembers(p.fields);
        result.totalNumberOfRows = getTotalNumberOfRows(p.oppoId);
        result.pricebookEntries = getPricebookEntries(paraWrapperStr);
        // result.totalNumberOfRows = getTotalNumberOfRows(w.oppoId);
        return result;
    }

    @AuraEnabled (cacheable = true)
    public static dataWithTotalLength getDataWithTotalLength (String paraWrapperWithFilterStr) {
        dataWithTotalLength result = new dataWithTotalLength();
        paraWrapperWithFilter p = (paraWrapperWithFilter) JSON.deserialize(paraWrapperWithFilterStr, paraWrapperWithFilter.class);
        result.totalNumberOfRows = getTotalNumberOfRowsWithFilter(p.paraWrapper.oppoId, p.filter);
        // system.debug(JSON.serialize(p.paraWrapper));
        result.pricebookEntries = getPricebookEntriesWithFilter(paraWrapperWithFilterStr);
        return result;
    }

    @AuraEnabled (cacheable = true)
    public static List<customFieldMember> getFieldMembers (String fields){
        // String fields = 'Product2.Id, Product2.Name, Product2.ProductCode, Product2.Description, Product2.Family, PricebookEntry.UnitPrice';
        // get objToFields:
        // {
            // PricebookEntry: [UnitPrice], 
            // Product2: [Name, ProductCode, Description, Family]
        // }
        Map<String,List<String>> objToFields = new Map<String,List<String>>();
        for (String s : fields.split(',')) {
            List<String> ObjAndField = s.trim().split('\\.');
            if (objToFields.containsKey(ObjAndField[0])) {
                List<String> fieldList = objToFields.get(ObjAndField[0]);
                fieldList.add(ObjAndField[1]);
                objToFields.put(ObjAndField[0],fieldList);
            } else {
                objToFields.put(ObjAndField[0], new List<String>{ObjAndField[1]});
            }
        }
        return getFieldMembersByObjToFieldsMap(objToFields);
    }

    public static List<customFieldMember> getFieldMembersByObjToFieldsMap(Map<String,List<String>> objToFields){
        List<customFieldMember> cFieldSetMembers = new List<customFieldMember> ();
        for (String obj : objToFields.keySet()) {
            type t = Type.forName(obj);
            SObject instance = (SObject)t.newInstance();
            for (String f : objToFields.get(obj)) {
                Schema.DescribeFieldResult descFieldResult = instance.getSObjectType().getDescribe().fields.getMap().get(f).getDescribe();
                customFieldMember cf = new customFieldMember();
                cf.objectName = obj;
                cf.name = descFieldResult.getName();
                cf.type = String.valueOf(descFieldResult.getType());
                cf.label = descFieldResult.getLabel();
                cFieldSetMembers.add(cf);
            }
        }
        System.debug(cFieldSetMembers);
        return cFieldSetMembers;
    }

    @AuraEnabled (cacheable = true)
    public static Integer getTotalNumberOfRows (String oppoId) {
        return [SELECT COUNT() FROM PricebookEntry 
        WHERE Pricebook2Id IN (SELECT Pricebook2Id FROM Opportunity WHERE Id = :oppoId)];
    }

    // SELECT  product2.id, Product2.Name, Product2.ProductCode, PricebookEntry.UnitPrice, Product2.Description, Product2.Family 
    // FROM PricebookEntry 
    // WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id =  '0064x00000MkQmKAAV')

    @AuraEnabled (cacheable = true)
    public static List<PricebookEntry> getPricebookEntries(string paraWrapperStr) {
        System.debug(paraWrapperStr);
        paraWrapper paras = (paraWrapper) JSON.deserialize(paraWrapperStr, paraWrapper.class);
        system.debug(paras.checkedRecordIds);
        String query ='';
        if (!paras.checkedRecordIds.isEmpty()) {
            query = 'SELECT ' + paras.fields + ' FROM PricebookEntry WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id = \'' + paras.oppoId + '\') '
                        + ' AND Id NOT IN (\'' + string.join(paras.checkedRecordIds,'\' , \'') + '\') ' 
                        + ' ORDER BY Product2.Name LIMIT ' + paras.limitSize + ' OFFSET ' + paras.offset;
        } else {
            query = 'SELECT ' + paras.fields + ' FROM PricebookEntry WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id = \'' + paras.oppoId 
                    + '\') ORDER BY Product2.Name LIMIT ' + paras.limitSize + ' OFFSET ' + paras.offset;
        }
        System.debug('query :' + query);
        System.debug('query length :' + query.length());
        List<PricebookEntry> pbEntries = Database.query(query);
        return pbEntries;
    }

    @AuraEnabled (cacheable = true)
    public static PricebookEntry getPricebookEntry(string id, string fields) {        
        String query = 'SELECT ' + fields + ' FROM PricebookEntry WHERE Id = \'' + id + '\' LIMIT 1';
        System.debug('query :' + query);
        List<PricebookEntry> pbEntries = Database.query(query);
        return pbEntries[0];
    }

    @AuraEnabled (cacheable = true)
    public static List<PricebookEntry> getPricebookEntriesWithFilter(string  paraWrapperWithFilterStr) {
        System.debug(paraWrapperWithFilterStr);
        paraWrapperWithFilter parasWithFilter = (paraWrapperWithFilter)JSON.deserialize(paraWrapperWithFilterStr, paraWrapperWithFilter.class);

        // Map<String, Object> jsonMap = (Map<String, Object>)JSON.deserializeUntyped(paraWrapperWithFilterStr);     
        // Map<String, Object> paras = (Map<String, Object>)jsonMap.get('paraObj');
        // String filter = (String)jsonMap.get('filter');
        // for (String p : paras.keySet()) {
        //     system.debug(paras.get(p));
        // }
        String query =  '';
        if (!parasWithFilter.paraWrapper.checkedRecordIds.isEmpty()) {
            query = 'SELECT ' + parasWithFilter.paraWrapper.fields + ' FROM PricebookEntry WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id = \'' + parasWithFilter.paraWrapper.oppoId
                    + '\') AND Product2.Name LIKE \'%' + parasWithFilter.filter + '%\' '
                    + ' AND Id NOT IN (\'' + string.join(parasWithFilter.paraWrapper.checkedRecordIds,'\' , \'') + '\') ' 
                    + ' ORDER BY Product2.Name LIMIT ' + parasWithFilter.paraWrapper.limitSize + ' OFFSET ' + parasWithFilter.paraWrapper.offset;
        } else {
            query = 'SELECT ' + parasWithFilter.paraWrapper.fields + ' FROM PricebookEntry WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id = \'' + parasWithFilter.paraWrapper.oppoId
            + '\') AND Product2.Name LIKE \'%' + parasWithFilter.filter + '%\' ORDER BY Product2.Name LIMIT ' + parasWithFilter.paraWrapper.limitSize + ' OFFSET ' + parasWithFilter.paraWrapper.offset;
        }
        System.debug('query :' + query);
        System.debug('query length :' + query.length()); 
        List<PricebookEntry> pbEntries = Database.query(query);
        System.debug(pbEntries);
        return pbEntries;
    }

    @AuraEnabled (cacheable = true)
    public static Integer getTotalNumberOfRowsWithFilter (String oppoId, String product2Name) {
        String filter = '%' + product2Name + '%';
        return [SELECT COUNT() FROM PricebookEntry 
        WHERE Pricebook2Id IN (SELECT Pricebook2Id FROM Opportunity WHERE Id = :oppoId) AND Product2.Name LIKE :filter];
    }

    // SELECT Product2Id, Product2.Name, Quantity, UnitPrice, ServiceDate, Description 
    //     FROM OpportunityLineItem 
    //     WHERE OpportunityId = '0064x00000MkQmKAAV'
    @AuraEnabled (cacheable = true)
    public static List<String> getRequiredFields(String objApiName){
        List<String> result = new List<String>();
        type t = Type.forName(objApiName);
        SObject instance = (SObject)t.newInstance();
        for (SObjectField field : instance.getSObjectType().getDescribe().fields.getMap().values()){
            Schema.DescribeFieldResult fieldResult = field.getDescribe();
            if (!fieldResult.isNillable() && fieldResult.isCreateable() && !fieldResult.isDefaultedOnCreate()){
                result.add(String.valueOf(field));
            }
        }
        system.debug(result);
        return result;
    }

    @AuraEnabled
    public static String saveOpportunityLineItems(List<OpportunityLineItem> oppoLineItems){
        system.debug(oppoLineItems);
        Database.SaveResult[] srList = Database.insert(oppoLineItems, false);
        String resultStatus = 'successed';
        // Iterate through each returned result
        for (Database.SaveResult sr : srList) {
            if (!sr.isSuccess()) {
                resultStatus = 'failed';
                for(Database.Error err : sr.getErrors()) {
                    System.debug('The following error has occurred.');                    
                    System.debug(err.getStatusCode() + ': ' + err.getMessage());
                    System.debug('Account fields that affected this error: ' + err.getFields());
                }
            }
        }

        return resultStatus;
    }
}