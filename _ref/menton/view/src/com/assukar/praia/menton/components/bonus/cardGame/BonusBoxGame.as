package com.assukar.praia.menton.components.bonus.cardGame
{
    import com.assukar.airong.error.AssukarError;
    import com.assukar.airong.utils.Statics;
    import com.assukar.airong.utils.Utils;
    import com.assukar.domain.services.dictio.Dictio;
    import com.assukar.praia.assets.Fonts;
    import com.assukar.praia.menton.assets.SoundID;
    import com.assukar.praia.menton.components.bonus.boxGame.BonusPrize;
    import com.assukar.praia.menton.components.bonus.boxGame.BoxM;
    import com.assukar.praia.menton.components.bonus.boxGame.BoxWave;
    import com.assukar.praia.menton.components.bonus.boxGame.FloorPanel;
    import com.assukar.praia.menton.components.bonus.boxGame.Sculptures;
    import com.assukar.praia.menton.components.bonus.boxGame.WeaponsPowerUp;
    import com.assukar.praia.menton.domain.FeteDuCitroinBonusSession;
    import com.assukar.view.sounds.Sounds;
    import com.assukar.view.starling.AssukarJuggler;
    import com.assukar.view.starling.AssukarTextField;
    import com.assukar.view.starling.Component;
    import com.assukar.view.starling.TouchableComponent;
    
    import starling.animation.Transitions;
    import starling.events.Touch;
    
    /**
     * ...
     * @author Igor Henrique Santos
     */
    public class BonusBoxGame extends Component
    {
        private var boxWave:BoxWave;
        private var weapons:WeaponsPowerUp;
        public var sculptures:Sculptures;
        private var floorPanel:FloorPanel;
        private var countRounds:AssukarTextField;
        private var session:FeteDuCitroinBonusSession;
        public var endRound:Function;
        private var bonusPrize:BonusPrize;
        public static const TOTAL_BOX_IN_ROUND:int = 3;
        private var posFloor:int = 700;
        private var messageFinalWave:Component;
        
        public function BonusBoxGame()
        {
        }
        
        override protected function draww():void
        {
            super.draww();
            
            floorPanel = addComp( FloorPanel, {y: posFloor} );
            
            countRounds = floorPanel.addText( 320, 65, Dictio.upper( "Rounds" ), Fonts.RUMPELSTILTSKIN, {
                x: 210, y: 155, color: 0xffffff, fontSize: 50, resizeOffset: true
            } );
            
            sculptures = addComp( Sculptures, {x: 60, y: 100} );
            weapons = addComp( WeaponsPowerUp, {x: 230, y: 50} );
            weapons.onblink = blinkBox;
            weapons.offblink = stopBlink;
            bonusPrize = addComp( BonusPrize, {x: 40, y: 650} );
            sculptures.onCompleteStep = onCompleteStep;
            sculptures.onNextStep = onUpdateStep;
            hide( bonusPrize );
            hide( weapons );
            hide( messageFinalWave );
            
            messageFinalWave = addComp( Component, {x: 0, y: 515} );
            messageFinalWave.addQuad( Statics.TOTAL_W, 58, 0x6e2007, {alpha: .75} );
            messageFinalWave.addText( Statics.TOTAL_W - 50, 58, Dictio.upper( "mentonpowerupavailable" ), Fonts.RUMPELSTILTSKIN, {
                x: 25, y: 7, fontSize: 70, color: 0x650404
            }, {resizeOffset: true} );
            messageFinalWave.addText( Statics.TOTAL_W - 50, 58, Dictio.upper( "mentonpowerupavailable" ), Fonts.RUMPELSTILTSKIN, {
                x: 25, y:5, fontSize: 70, color: 0xffffff
            }, {resizeOffset: true} );
        }
        
        public function onUpdateStep( idSculpture:int ):void
        {
            if ( this.session.pendingBoxesToOpen == 0 )
            {
                removeListeners();
                AssukarJuggler.ME.delayCall( endRound, 1.1 );
            }
            else
            {
                addBoxListeners();
            }
        }
        
        public function onCompleteStep( idSculpture:int ):void
        {
            AssukarJuggler.ME.delayCall( endRound, 1.2 );
            floorPanel.turnOnPanel( idSculpture );
        }
        
        override public function dispose():void
        {
            if ( boxWave )
            {
                AssukarJuggler.ME.removeTweens( boxWave );
            }
            
            AssukarJuggler.ME.removeTweens( bonusPrize );
            super.dispose();
        }
        
        public function init( feteDuCitroinBonusSession:FeteDuCitroinBonusSession ):void
        {
            this.session = feteDuCitroinBonusSession;
            floorPanel.resetDisplay();
            floorPanel.updateValue();
            floorPanel.y = posFloor;
            floorPanel.y += 400;
            AssukarJuggler.ME.tween( floorPanel, 0.6, {y: posFloor} );
            sculptures.init();
            hide( bonusPrize );
            hide( messageFinalWave );
        }
        
        public function callWave():void
        {
            if ( boxWave )
            {
                removeChild( boxWave, true );
            }
            
            boxWave = addComp( BoxWave, {x: 40, y: 600} );
            
            show( weapons );
            weapons.init();
            weapons.configure( this.session );
            var saveX:int = boxWave.x;
            boxWave.x = 800;
            AssukarJuggler.ME.tween( boxWave, 1, {
                x: saveX, transition: Transitions.EASE_OUT_BACK, onComplete: addBoxListeners
            } );
            Sounds.ME.playFx( SoundID.BONUS_MACHINE_MOVING, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60 );
            
            //LAST ROUND
            var countPowerups:int = 0;
            if ( this.session.hasCrowbar )
            {
                countPowerups++;
            }
            if ( this.session.hasHammer )
            {
                countPowerups++;
            }
            if ( this.session.hasSledgehammer )
            {
                countPowerups++;
            }
            
            if ( (this.session.rounds + 1) <= countPowerups )
            {
                show( messageFinalWave );
                if ( weapons.messageGuide.visible )
                {
                    weapons.messageGuide.visible = false;
                }
            }
        }
        
        public function resetWeapons( session:FeteDuCitroinBonusSession ):void
        {
            this.session = session;
            weapons.configure( this.session );
            weapons.useWeapon = false;
            weapons.selectWeapon = 0;
        }
        
        public function removeWeaponsBump():void
        {
            weapons.removeBump();
        }
        
        private function addBoxListeners():void
        {
            for ( var i:int = 0; i < boxWave.boxList.length; i++ )
            {
                boxWave.boxList[i].enable();
                boxWave.boxList[i].RELEASE.listen( checkBoxClick );
            }
        }
        
        public function removeListeners():void
        {
            for ( var i:int = 0; i < boxWave.boxList.length; i++ )
            {
                boxWave.boxList[i].disable();
                boxWave.boxList[i].RELEASE.unlisten( checkBoxClick );
            }
        }
        
        private function blinkBox():void
        {
            for ( var i:int = 0; i < boxWave.boxList.length; i++ )
            {
                boxWave.boxList[i].stopBlink();
                boxWave.boxList[i].blinkIndication();
            }
        }
        
        private function stopBlink():void
        {
            for ( var i:int = 0; i < boxWave.boxList.length; i++ )
            {
                boxWave.boxList[i].stopBlink();
            }
        }
        
        private function checkBoxClick( tc:TouchableComponent, t:Touch ):void
        {
            removeListeners();
            hide( weapons.messageGuide, messageFinalWave );
            
            var boxM:BoxM = tc as BoxM;
            var i:int = 0;
            
            //check use powerups
            if ( weapons.useWeapon )
            {
                weapons.useWeapon = false;
                //crownbar
                if ( weapons.selectWeapon == 1 && this.session.canUseCrowbar )
                {
                    addBoxListeners();
                    var idLemon:int = this.session.useCrowbar( boxM.index );
                    //SHOW FRONT
                    boxM.useCrownBar();
                    boxM.showFront( idLemon );
                    weapons.disableCrownBar();
                    
                    for ( i = 0; i < boxWave.boxList.length; i++ )
                    {
                        boxWave.boxList[i].stopBlink();
                    }
                }
                else if ( weapons.selectWeapon == 2 && this.session.canUseHammer )
                {
                    weapons.init();
                    this.session.useHammer();
                    var hammerLemons:int = session.chooseBox( boxM.index );
                    boxM.configureLemons( hammerLemons );
                    boxM.useHammer();
                    boxM.explodeBox();
                    sculptures.update( hammerLemons );
                    boxM.disable();
                    boxM.touchable = false;
                    
                }
                else if ( weapons.selectWeapon == 3 && this.session.canUseSledgehammer )
                {
                    weapons.init();
                    this.session.useSledgehammer();
                    var sledgeHammer:int = session.chooseBox( boxM.index );
                    boxM.configureLemons( sledgeHammer );
                    boxM.useSledgeHammer();
                    boxM.explodeBox();
                    sculptures.update( sledgeHammer );
                    boxM.disable();
                    boxM.touchable = false;
                    
                }
                else
                {
                    Utils.log( "this.session.canUseCrowbar " + this.session.canUseCrowbar );
                    Utils.log( "this.session.canUseHammer " + this.session.canUseHammer );
                    Utils.log( "this.session.canUseSledgehammer " + this.session.canUseSledgehammer );
                    throw new AssukarError( "WEAPON ERROR " + weapons.selectWeapon );
                }
            }
            else
            {
                var lemons:int = session.chooseBox( boxM.index );
                boxM.configureLemons( lemons );
                
                if ( weapons.selectWeapon == 2 )
                {
                    boxM.useHammer();
                }
                else if ( weapons.selectWeapon == 3 )
                {
                    boxM.useSledgeHammer();
                }
                
                boxM.explodeBox();
                sculptures.update( lemons );
                
                if ( session.pendingBoxesToOpen == 0 )
                {
                    for ( i = 0; i < boxWave.boxList.length; i++ )
                    {
                        boxWave.boxList[i].disable();
                        boxWave.boxList[i].RELEASE.unlisten( checkBoxClick );
                        boxWave.boxList[i].touchable = false;
                        
                        if ( boxM.index != boxWave.boxList[i].index )
                        {
                            boxWave.boxList[i].showXray( this.session.getLemonBoxes( i ) );
                        }
                    }
                    
                }
            }
            
            if ( this.session.over )
            {
                hide( weapons );
                countRounds.text = Dictio.upper( "END" );
            }
        }
        
        public function updateRounds( rounds:int ):void
        {
            var keyRound:String;
            var count:int = (rounds + 1);
            
            if ( count <= 1 )
            {
                keyRound = Dictio.upper( "Round" );
            }
            else
            {
                keyRound = Dictio.upper( "Rounds" );
            }
            
            countRounds.text = (rounds + 1) + " " + keyRound;
        }
        
        public function callFinalBonus( payout:int, callback:Function ):void
        {
            sculptures.showSculpturesWon();
            
            if ( boxWave )
            {
                removeChild( boxWave, true );
            }
            
            bonusPrize.configure( payout );
            show( bonusPrize );
            
            var saveX:int = bonusPrize.x;
            bonusPrize.x = 800;
            AssukarJuggler.ME.tween( bonusPrize, 1.2, {x: saveX} );
            AssukarJuggler.ME.delayCall( callback, 5 );
        }
        
    }
    
}