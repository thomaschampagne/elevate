class HeaderView extends AbstractDataView {

    constructor() {
        super(null);
    }

    render(): void {

        this.content += "<div style='width:100%; margin-left: 10px; margin-top: 10px; margin-bottom: 5px;font-size: 14px;'>";
        this.content += "   <div style='display: inline;'><img style='width:30px' src='" + this.appResources.logoNoText + "'/></div>";
        this.content += "   <div style='display: inline;'><img style='width:100px' src='" + this.appResources.logoTextOnly + "'/></div>";
        this.content += "   <div style='display: inline;'>EXTENDED STATS PANEL</div>";
        this.content += "   <div style='display: inline; margin-right: 10px;'>";
        this.content += "       <a href='" + this.appResources.settingsLink + "#/?showDonation=true' target='_blank' style='font-size: 12px;'> (Do you <img style='width: 12px;' src='" + this.appResources.heartIcon + "'/> this project?)</a>";
        this.content += "   </div>";
        this.content += "</div>";
    }

    protected insertDataIntoGrid(): void {

    }

    public displayGraph(): void {

    }

}