package com.assukar.praia.menton.components.jackpot
{
    import com.assukar.airong.text.TextUtils;
    import com.assukar.domain.services.dictio.Dictio;
    import com.assukar.praia.assets.Fonts;
    import com.assukar.praia.assets.PraiaCommonAssets;
    import com.assukar.praia.components.FontResolver;
    import com.assukar.praia.components.vip.TarjaVip;
    import com.assukar.praia.domain.games.vbs.MentonVBB;
    import com.assukar.praia.domain.jackpots.JackpotMarkupController;
    import com.assukar.praia.domain.vip.VipStatus2;
    import com.assukar.praia.main.PraiaContext;
    import com.assukar.praia.menton.assets.MentonAssets;
    import com.assukar.praia.menton.components.buttons.ButtonPanel;
    import com.assukar.praia.menton.domain.MentonJackpot;
    import com.assukar.praia.menton.domain.MentonJackpotSession;
    import com.assukar.praia.services.navigation.Screens;
    import com.assukar.view.starling.Component;
    import com.assukar.view.starling.TouchableComponent;
    
    import flash.geom.Rectangle;
    
    import starling.display.Image;
    import starling.events.Touch;
    import com.assukar.view.starling.AssukarTextField;
    import starling.text.TextFieldAutoSize;
    import starling.utils.Align;
    
    public class JackpotPanel extends TouchableComponent
    {
        // singleton
        static public var ME:JackpotPanel;
        // prize area
        private const AREA:Rectangle = new Rectangle( 50, 90, 158, 40 );
        
        public function JackpotPanel()
        {
            ME = singleton( ME );
        }
        
        override public function dispose():void
        {
            super.dispose();
            ME = null;
        }
        
        private var lightsContainer:Component;
        private var coinIcon:Image;
        private var pContainer:Component;
        private var label:AssukarTextField;
        private var percentageLabel:AssukarTextField;
//		private var lights: JackpotLights;
        private var mTextJackpot:AssukarTextField;
        private var ballsToJackpot:AssukarTextField;
        private var mImageBackGroundOn:Image;
        
        override protected function draww():void
        {
            addImage( MentonAssets.ME.texture( "prizejack" ), {x: 50, y: 50} );
            mImageBackGroundOn = addImage( MentonAssets.ME.texture( "prizejack_on" ), {x: 50, y: 50, visible: false} );
            
            lightsContainer = addComp();

//			lights = lightsContainer.addComp(JackpotLights, {x:-6, y:29});
            
            pContainer = addComp();
            
            coinIcon = pContainer.addImage( PraiaCommonAssets.ME.texture( "ficha57_sk" ), {
                centerPivots: true, y: 3, x: 0
            }, {scale: 0.75} );
            label = pContainer.addText( 135, 59, "", Fonts.MYRIADPRO_BOLD, {
                x: coinIcon.x + coinIcon.width / 2 + 5,
                color: 0xffe79c,
                fontSize: 37,
                hAlign: Align.LEFT,
                autoSize: TextFieldAutoSize.HORIZONTAL
            } );
            label.y = coinIcon.y - label.height / 2;
            percentageLabel = addText( AREA.width, AREA.height, "", Fonts.MYRIADPRO_BOLD, {
                x: AREA.x, y: AREA.y - 7, color: 0xffe79c, fontSize: 38
            } );
            hide( pContainer, percentageLabel );
            
            pContainer.x = AREA.x + AREA.width / 2 - pContainer.width / 2 + 15;
            pContainer.y = AREA.y + AREA.height - pContainer.height / 2;
            
            //lineOff = addImage(MentonAssets.ME.texture("jackpotoff"),{x:16, y:70, visible:false});
            
            mTextJackpot = addText( 158, 30, Dictio.upper( "Jackpot" ), FontResolver.ME.resolveFontName( Fonts.IOWAN_BLACK ), {
                fontSize: 18, color: 0xffffff
            }, {x: 50, y: 50, resizeOffset: true} );
            ballsToJackpot = addText( 158, 30, Dictio.upper( "untilBall", {ball: MentonJackpotSession.ME.ballsToJackpot} ), FontResolver.ME.resolveFontName( Fonts.IOWAN_BLACK ), {
                visible: false, fontSize: 18, color: 0x4E2B0D
            }, {x: 50, y: 50, resizeOffset: true} );
            
            var vip:int = VipStatus2.ME ? VipStatus2.ME.stars : 0;
            if ( vip > 0 )
            {
                var percentage:int = JackpotMarkupController.ME ? JackpotMarkupController.ME.myPercentageMarkup : 0;
                addComp( new TarjaVip( vip, percentage ).draw(), {centerPivots: true}, {x: 193, y: 81} );
            }
            
            RELEASE.listen( releaseHAndler );
            enable();
        }
        
        private function releaseHAndler( comp:TouchableComponent, touch:Touch ):void
        {
            if ( MentonJackpotSession.ME.jackpot.validUpdate )
            {
                MentonJackpotSession.ME.request();
                PraiaContext.ME.navigator.triggerNonPrimary( Screens.JACKPOT_INFO, null, [MentonVBB.ME] );
            }
        }
        
        public function updatePercentage( percentageActivated:int ):void
        {
            if ( percentageActivated == currentJackpotPercentage )
            {
                return;
            }
            currentJackpotPercentage = percentageActivated;
            selectColor();
            checkJackpotValue();
            percentageLabel.color = labelColor.percentage;
            percentageLabel.text = String( percentageActivated ) + "%";
            show( percentageLabel );
            hide( pContainer );
        }
        
        private var oldUpdateValue:int;
        private var currentJackpotValue:int;
        private var currentJackpotPercentage:int;
        private var labelColor:Object;
        private var valueToTween:Object = {prize: 0};
        
        public function update( value:int ):void
        {
            if ( !value )
            {
                clear();
                return;
            }
            
            currentJackpotValue = value * (currentJackpotPercentage / 100);
            if ( currentJackpotValue == oldUpdateValue )
            {
                return;
            }

//			selectColor();
            
            delayCall( "update", juggler.delayCall( function ():void {
                show( pContainer );
                hide( percentageLabel );
                
                label.color = labelColor.label;
                
                if ( currentJackpotValue < oldUpdateValue )
                {
                    oldUpdateValue = currentJackpotValue;
                    label.text = TextUtils.formatNumber( currentJackpotValue );
                    pContainer.x = AREA.x + AREA.width / 2 - pContainer.width / 2 + 15;
                }
                else
                {
                    oldUpdateValue = currentJackpotValue;
                    
                    coinIcon.visible = true;
                    juggler.removeTweens( valueToTween );
                    valueToTween = {prize: int( TextUtils.removeSeparator( label.text ) )};
                    juggler.tween( valueToTween, 1, {
                        prize: currentJackpotValue, onUpdate: function ():void {
                            var prizeValue:String = TextUtils.formatNumber( valueToTween.prize );
                            label.text = prizeValue;
//						if (Menton.ME) Menton.ME.updateJackpot(prizeValue);
                            pContainer.x = AREA.x + AREA.width / 2 - pContainer.width / 2 + 15;
                        }, onComplete: function ():void {
                            var prizeValue:String = TextUtils.formatNumber( valueToTween.prize );
                            label.text = prizeValue;
//						if (Menton.ME) Menton.ME.updateJackpot(prizeValue);
                        }
                    } );
                }
                
            }, 1 ) );
            
        }
        
        private function selectColor():void
        {
            var defaultColor:uint = ButtonPanel.STAKE_COLORS[5];
            
            switch ( currentJackpotPercentage )
            {
                case 10:
                    labelColor = {label: defaultColor, percentage: ButtonPanel.STAKE_COLORS[0]};
                    break;
                case 20:
                    labelColor = {label: defaultColor, percentage: ButtonPanel.STAKE_COLORS[1]};
                    break;
                case 40:
                    labelColor = {label: defaultColor, percentage: ButtonPanel.STAKE_COLORS[2]};
                    break;
                case 60:
                    labelColor = {label: defaultColor, percentage: ButtonPanel.STAKE_COLORS[3]};
                    break;
                case 100:
                    labelColor = {label: defaultColor, percentage: ButtonPanel.STAKE_COLORS[4]};
                    break;
                default:
                    labelColor = {label: defaultColor, percentage: ButtonPanel.STAKE_COLORS[0]};
            }

//			lights.setLeds(JackpotLights.ON);
        }
        
        private function checkJackpotValue():void
        {
            if ( MentonJackpotSession.ME.getPayout().coins > MentonJackpot.BALL_KICK_THRESHOLDS[0] && currentJackpotPercentage == 100 )
            {
//				labelColor = {label:0xffffff, percentage:0xffffff};
//				lights.setLeds(JackpotLights.ALL_ON_BLINK);
            }
            else
            {
                selectColor();
            }
        }
        
        public function clear():void
        {
            
            label.text = "";
            percentageLabel.text = "";
            hide( pContainer, percentageLabel, mImageBackGroundOn );
            
            turnOn();
        }
        
        public function activate():void
        {

//			lights.setLeds(JackpotLights.ON);
            turnOn();
//			show(jackpotDisplayON);
            // lightsMovie.mode = JackpotLightsMovie.MODE_0();
//			lightsMovie.playLights(JackpotLightsMovie.MODE_0);

//			Sounds.ME.playFx(SoundID.HEART, null, int.MAX_VALUE);
        
        }
        
        private function turnOn():void
        {
            show( mTextJackpot );
            hide( ballsToJackpot, mImageBackGroundOn );//lineOff
            percentageLabel.alpha = pContainer.alpha = 1;
            checkJackpotValue();
        }
        
        public function turnOff():void
        {
//			lights.setLeds(JackpotLights.OFF);
            
            show( ballsToJackpot );//lineOff,
            hide( mTextJackpot, mImageBackGroundOn );
            ballsToJackpot.text = Dictio.upper( "untilBall", {ball: MentonJackpotSession.ME.ballsToJackpot} );
            
            percentageLabel.alpha = pContainer.alpha = .4;
        }
        
        public function deactivate():void
        {
//			lights.setLeds(JackpotLights.OFF);
            turnOn();
//			hide(jackpotDisplayON);
            // lightsMovie.turnOff();
//			lightsMovie.stop();

//			Sounds.ME.stopFx(SoundID.HEART);
        
        }
        
        public function won():void
        {
//			lights.setLeds(JackpotLights.WON);
//			show(jackpotDisplayON);
            // lightsMovie.mode = JackpotLightsMovie.MODE_1();
//			lightsMovie.playLights(JackpotLightsMovie.MODE_1);
        }
        
        public function oneToWin():void
        {
//			lights.setLeds(JackpotLights.ONE_TO_WIN);
            show( mImageBackGroundOn );
        }
        
        public function someoneWon():void
        {
//			lights.setLeds(JackpotLights.SOMEONE_WON);
        }
    }
}