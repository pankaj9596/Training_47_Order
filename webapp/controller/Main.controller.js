sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/export/library',
    'sap/ui/export/Spreadsheet',
    'sap/m/MessageToast',
    'sap/ui/core/Fragment',
    "sap/m/MessageBox"
],
    function (Controller, JSONModel, Filter, FilterOperator, spreadsheetLibrary, Spreadsheet, MessageToast, Fragment,MessageBox) {
        "use strict";
        var EdmType = spreadsheetLibrary.EdmType;
        return Controller.extend("com.training.order.controller.Main", {
            onInit: function () {
                var self = this;
                // sap.ui.getCore().getConfiguration().setLanguage("de");
                var oModel = new JSONModel("/model/data.json", '', false);
                // var oModel = new sap.ui.model.json.JSONModel()
                oModel.dataLoaded().then(function (data) {
                    oModel.setSizeLimit(1000);
                    console.log(oModel.getData());
                    this.getView().setModel(oModel)
                }.bind(this));
            },
            onSearch: function (oEvent) {
                debugger;
                // holds the values passed into the search field
                var sQuery = oEvent.getSource().getValue();

                // add filter for search
                var aGlobalFilters = [];

                if (sQuery && sQuery.length > 0) {
                    var aFilters = []
                    var orderIdFilter = new Filter("OrderID", FilterOperator.EQ, sQuery);
                    var countryFilter = new Filter("ShipCountry", FilterOperator.Contains, sQuery);
                    aFilters.push(orderIdFilter);
                    aFilters.push(countryFilter);

                    var oCombinedFilter = new Filter({
                        filters: aFilters,
                        and: false
                    });

                    aGlobalFilters.push(oCombinedFilter);
                }



                //update the bindind of the table

                var oTable = this.getView().byId("tblOrder");
                var oBinding = oTable.getBinding("items");
                oBinding.filter(aGlobalFilters, "Applications");

            },

            onExport: function () {
                // Taking source of the table which is binded with the local json model
                var oOrderTable = this.getView().byId("tblOrder");
                // get the binding
                var oBinding = oOrderTable.getBinding("items");
                var aColumn = [];
                //prepare column configuration
                var oColumnOrderId = {
                    label: 'Order Id',
                    property: 'OrderID',
                    type: EdmType.Number,
                    width: '15',
                }
                var oColumnShipName = {
                    label: 'Ship Name',
                    property: 'ShipName',
                    type: EdmType.String,
                    width: '10',
                    textAlign: 'center',
                    wrap: true
                }
                aColumn.push(oColumnOrderId);
                aColumn.push(oColumnShipName);
                // prepare spreadsheet setting
                var oSettings = {
                    workbook: {
                        columns: aColumn
                    },
                    dataSource: oBinding,
                    fileName: 'Order.xlsx'
                }
                // initializae spreadsheet constructor
                var oSheet = new Spreadsheet(oSettings);
                oSheet.onprogress = function (iValue) {
                    ("Export: %" + iValue + " completed");
                };
                oSheet.build()
                    .then(
                        function () {
                            MessageToast.show("Data downloaded successfully..!!")
                        }
                    )
                    .finally(function () {
                        oSheet.destroy();
                    });
            },
            onPressOrderId: function (oEvent) {

                var sPath = oEvent.getSource().getBindingContext().getPath();
                var oModel = oEvent.getSource().getModel()
                var oContextObj = oModel.getProperty(sPath);

                var oView = this.getView();
                if (!this._displayOrderDialog) {
                    this._displayOrderDialog = Fragment.load({
                        id: 'frgDisplayOrder',
                        name: "com.training.order.fragment.DisplayOrder",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog)
                        return oDialog;
                    });
                }

                // this._displayOrderDialog.bindElement(sPath);

                this._displayOrderDialog.then(function (oDialog) {
                    oDialog.bindElement(sPath)
                    oDialog.open()
                }.bind(this));

            },
            onPressEditOrder: function (oEvent) {

                var sPath = oEvent.getSource().getBindingContext().getPath();
                var oModel = oEvent.getSource().getModel()
                var oContextObj = oModel.getProperty(sPath);

                var oView = this.getView();
                if (!this._editOrderDialog) {
                    this._editOrderDialog = Fragment.load({
                        id: this.createId("frgEditOrder"),
                        name: "com.training.order.fragment.EditOrder",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog)
                        return oDialog;
                    });
                }

                // this._displayOrderDialog.bindElement(sPath);

                this._editOrderDialog.then(function (oDialog) {
                    oDialog.bindElement(sPath)
                    oDialog.open()
                }.bind(this));

            },
            onPressCreateOrder: function () {
                var oView = this.getView();
                if (!this._createOrderDialog) {
                    this._createOrderDialog = Fragment.load({
                        id: 'frgCreateOrder',
                        name: "com.training.order.fragment.CreateOrder",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog)
                        return oDialog;
                    });
                }
                this._createOrderDialog.then(function (oDialog) {

                    oDialog.open()
                }.bind(this));

            },

            onCreateOrderPress: function () {
                debugger;
                var iOrderId = sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateOrderId").getValue();
                var sCustomerId = sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateCustomerId").getValue();
                var iEmployeeId = sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateEmployeeId").getValue();
                var dOrderDate = sap.ui.core.Fragment.byId("frgCreateOrder", "dpCreateOrderDate").getValue();
                var sShipName = sap.ui.core.Fragment.byId("frgCreateOrder", "txtAreaCreateShipName").getValue();
                var sShipCity = sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateShipCity").getValue();
                var sShipCountry = sap.ui.core.Fragment.byId("frgCreateOrder", "cbShipCountry").getSelectedItem().getText();


                if(!iOrderId){
                    sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateOrderId").setValueState("Error")
                }else{
                    sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateOrderId").setValueState("None")
                }

                var obj = {
                    
                        "OrderID": iOrderId,
                        "CustomerID": sCustomerId,
                        "EmployeeID": iEmployeeId,
                        "OrderDate": dOrderDate,
                        "ShipName": sShipName,
                        "ShipAddress": "59 rue de l'Abbaye",
                        "ShipCity": sShipCity,
                        "ShipPostalCode": "51100",
                        "ShipCountry": sShipCountry
                }

                var oModel = this.getView().getModel();
                var aData = oModel.getProperty("/Orders")
                aData.push(obj);
                oModel.setProperty("/Orders",aData);
                oModel.refresh(true);

                this.onCloseCreateDialogPress();
            },
            onCloseCreateDialogPress: function(){
                this._createOrderDialog.then(function (oDialog) {

                    oDialog.close()
                }.bind(this));
            },
            onCloseDisplayDialogPress: function(){
                this._displayOrderDialog.then(function (oDialog) {

                    oDialog.close()
                }.bind(this));
            },
            onCloseEditDialogPress: function(){
                this._editOrderDialog.then(function (oDialog) {

                    oDialog.close()
                }.bind(this));
            },

            onPressDeleteOrder: function(oEvent){
                var sPath = oEvent.getSource().getBindingContext().getPath();
                var oModel = oEvent.getSource().getModel();
                var aData = oModel.getProperty("/Orders")
                var oContextObj = oModel.getProperty(sPath);
                var idx = parseInt(sPath.substring(sPath.lastIndexOf('/') +1));
               
                
                var sMessage = "Are you sure, you want to delete the Order : " + oContextObj.OrderID;
                var sTitle = "Confirm Deletion?"
                MessageBox.confirm(sMessage,{
                    title : sTitle,
                    actions : [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction : sap.m.MessageBox.Action.OK,
                    onClose : function(evt){
                        debugger;
                        if(evt === "OK"){
                           
                                aData.splice(idx, 1);
                                oModel.setProperty("/Orders",aData);
                                oModel.refresh(true);
                        }else{
                            return;
                        }
                    }.bind(this)
                });

            },
            onUpdateOrderDialogPress: function(oEvent){
                debugger;
                this._editOrderDialog.then(function (oDialog) {
                    // oDialog.bindElement(sPath)
                    debugger;
                }.bind(this));
            }
        });
    });
