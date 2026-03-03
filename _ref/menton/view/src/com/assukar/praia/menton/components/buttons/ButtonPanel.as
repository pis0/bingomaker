package com.assukar.praia.menton.components.buttons
{
    import com.assukar.praia.components.FreeSpinBigTag;
    import com.assukar.praia.components.FreeSpinTag;
    import com.assukar.praia.main.PraiaContext;
    import com.assukar.praia.menton.components.buttons.payout.Payout;
    import com.assukar.praia.menton.controllers.ButtonsController;
    import com.assukar.view.starling.Component;
    import com.assukar.view.starling.TouchableComponent;
    
    import flash.geom.Point;
    import flash.ui.Keyboard;
    
    import starling.events.Touch;
    
    /**
     * @author Johnatan
     */
    public class ButtonPanel
            extends TouchableComponent
    {
        // singleton
        static public var ME:ButtonPanel;
        static public const STAKE_COLORS:Vector.<uint> = new <uint> [0x6AB22F, 0xB1AA03, 0xCF499D, 0x66736F, 0x4781CD, 0xd5cdaa, 0x80128F, 0xffffff];
        
        static public const CANCELLABLE:int = 0;
        static public const NONCANCELLABLE:int = 1;
        
        public function ButtonPanel()
        {
            ME = singleton(ME);
        }
        
        override public function dispose():void
        {
            super.dispose();
            ME = null;
        }
        
        // object vars
        public var autoPlayContainer:Component;
        public var playButton:PlayButton;
        public var extraButton:ExtraButton;
        public var endButton:EndButton;
        
        public var stakesButton:StakesButton;
        public var payout:Payout;
        private var posPlay:Point;
        
        // gesture
        private var extraGestureComp:TouchableComponent;
        private var payoutGestureComp:TouchableComponent;
        
        public var freeSpinBigTag:FreeSpinBigTag;
        public var freeTag:FreeSpinTag;
        
        override protected function draww():void
        {
            var posPayout:Point = new Point(525, 10);
            var posStake:Point = new Point(21, 13);
            posPlay = new Point(226, 0);
            
            enable();
            
            stakesButton = addComp(StakesButton, {name: "stakes", x: posStake.x, y: posStake.y});
            
            autoPlayContainer = addComp();
            endButton = autoPlayContainer.addComp(EndButton, {name: "end", x: posStake.x, y: posPlay.y + 10});
            playButton = autoPlayContainer.addComp(PlayButton, {name: "play", x: posPlay.x, y: posPlay.y});
            extraButton = autoPlayContainer.addComp(ExtraButton, {name: "extra", x: posPlay.x, y: posPlay.y});
            
            payout = addComp(Payout, {x: posPayout.x, y: posPayout.y});
            
            extraGestureComp = addComp(TouchableComponent, {x: 6, y: -618});
            extraGestureComp.addQuad(142, 115, 0xff0000, {alpha: 0});
            extraGestureComp.RELEASE.listen(extraGestureHandler);
            extraGestureComp.enabled = true;
            
            payoutGestureComp = addComp(TouchableComponent, {x: 518, y: 4});
            payoutGestureComp.addQuad(216, 108, 0x00ff00, {alpha: 0});
            payoutGestureComp.RELEASE.listen(payoutGestureHandler);
            payoutGestureComp.enabled = true;
            
            freeTag = addComp(FreeSpinTag, {
                x: 410, y: -15
                //, visible:false
            });
            //if (MentonEngine.ME.getFreeSpins()) freeTag.startBGAnim(MentonEngine.ME.getFreeSpins());
            //else freeTag.stopBGAnim();
            freeTag.update();
            
            // M2 / M22X
            if (PraiaContext.ME.oneHandDevice)
            {
                extraGestureComp.y = -680;
            }
            
            enableKeyboard();
            
            freeSpinBigTag = addComp(FreeSpinBigTag, {x: 270, y: 15, visible: false});
        }
        
        private function extraGestureHandler(c:TouchableComponent, t:Touch):void
        {
            
            if (playButton.enabled && (playButton.phase == ButtonsController.PLAY || playButton.phase == ButtonsController.SUPER || playButton.phase == ButtonsController.PEEL))
            {
                ButtonPanel.ME.playButton.emulate(ButtonPanel.ME.playButton.PRESS);
                ButtonPanel.ME.playButton.emulate(ButtonPanel.ME.playButton.RELEASE);
            }
            
            if (extraButton.enabled && extraButton.phase == ButtonsController.EXTRA)
            {
                ButtonPanel.ME.extraButton.emulate(ButtonPanel.ME.extraButton.PRESS);
                ButtonPanel.ME.extraButton.emulate(ButtonPanel.ME.extraButton.RELEASE);
            }
        }
        
        private function payoutGestureHandler(c:TouchableComponent, t:Touch):void
        {
            if (endButton.enabled)
            {
                ButtonPanel.ME.endButton.emulate(ButtonPanel.ME.endButton.PRESS);
                ButtonPanel.ME.endButton.emulate(ButtonPanel.ME.endButton.RELEASE);
            }
        }
        
        public function set state(value:int):void
        {
            var posYPlay:int = 0;
            
            switch (value)
            {
                case CANCELLABLE:
                    show(endButton);
                    playButton.y = posYPlay;
                    break;
                case NONCANCELLABLE:
                    hide(endButton);
                    playButton.y = posYPlay;
                    break;
            }
        }
        
        public function enableKeyboard():void
        {
            stakesButton.assignKeys([Keyboard.LEFT]);
            endButton.assignKeys([Keyboard.UP]);
            playButton.assignKeys([Keyboard.DOWN, Keyboard.ENTER, Keyboard.NUMPAD_ENTER, Keyboard.SPACE]);
        }
        
        public function disableKeyboard():void
        {
            stakesButton.assignKeys([]);
            endButton.assignKeys([]);
            playButton.assignKeys([]);
        }
    }
}
