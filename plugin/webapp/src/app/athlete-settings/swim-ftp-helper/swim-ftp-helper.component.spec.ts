import { SwimFtpHelperComponent } from "./swim-ftp-helper.component";

describe("SwimFtpHelperComponent", () => {

	/*	let component: SwimFtpHelperComponent;
        let fixture: ComponentFixture<SwimFtpHelperComponent>;

        beforeEach(async(() => {
            TestBed.configureTestingModule({
                declarations: [SwimFtpHelperComponent]
            }).compileComponents();
        }));

        beforeEach(() => {
            fixture = TestBed.createComponent(SwimFtpHelperComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });*/

	it("should convert swim speed to pace", () => {
		expect(SwimFtpHelperComponent.convertSwimSpeedToPace(1)).toBe("01:40:00");
		expect(SwimFtpHelperComponent.convertSwimSpeedToPace(31)).toBe("00:03:14");
		expect(SwimFtpHelperComponent.convertSwimSpeedToPace(500)).toBe("00:00:12");
	});
});
