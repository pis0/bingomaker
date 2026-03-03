package com.assukar.praia.menton.components
{
    import com.assukar.domain.services.navigation.Primary;
    import com.assukar.praia.components.AutoPlayPanel;
    import com.assukar.praia.components.hint.GameTypeHint;
    import com.assukar.praia.components.howtoplay.HowToPlayBox;
    import com.assukar.praia.domain.games.vbs.MentonVBB;
    import com.assukar.praia.domain.levels.GameLevelsController;
    import com.assukar.praia.main.PraiaContext;
    import com.assukar.praia.menton.components.balls.BallPanelMenton;
    import com.assukar.praia.menton.components.bellPanel.BellPanel;
    import com.assukar.praia.menton.components.bonus.BonusGame;
    import com.assukar.praia.menton.components.buttons.ButtonPanel;
    import com.assukar.praia.menton.components.buttons.CancelAutoButton;
    import com.assukar.praia.menton.components.buttons.CancelButton;
    import com.assukar.praia.menton.components.cards.CardPanel;
    import com.assukar.praia.menton.components.howtoplay.MentonHowToPlayContent;
    import com.assukar.praia.menton.components.jackpot.JackpotPanel;
    import com.assukar.praia.menton.components.particles.ParticlesLayer;
    import com.assukar.praia.menton.components.payouts.PayoutTable;
    import com.assukar.praia.menton.components.prizes.PrizePanel;
    import com.assukar.praia.menton.components.scenery.Scenery;
    import com.assukar.praia.menton.main.MentonView;
    import com.assukar.view.starling.Component;
    
    public class Menton extends Component implements Primary
    {
        // singleton
        static public var ME:Menton;
        static public var OFFSET_Y:int;
        
        public function Menton()
        {
            ME = singleton( ME );
            MissingBallSyncer.ME = new MissingBallSyncer();
        }
        
        override public function dispose():void
        {
            PraiaContext.ME.hudServices.hideTourneyFooter();
            super.dispose();
            MissingBallSyncer.ME.dispose();
            ME = null;
        }
        
        // object vars
        public var scenery:Scenery;
        public var jackpot:JackpotPanel;
        public var payoutTable:PayoutTable;
        public var bellPanel:BellPanel;
        public var cards:CardPanel;
        public var balls:BallPanelMenton;
        public var buttons:ButtonPanel;
        //		public var autoPlayPanel : AutoPlayPanel;
        public var prizes:PrizePanel;
        public var particles:ParticlesLayer;
        private var bonusGame:BonusGame;
        
        private var autoplaypanel:AutoPlayPanel;
        
        //		public var bonusGame:BonusGame;
        
        override protected function draww():void
        {
            var scaleHandDevice:Number = 1;
            var scaleXPayoutTable:Number = 1;
            var scaleYPayoutTable:Number = 1;
            var posXPayout:int = 80;
            var posYPrizePanel:Number = 0;
            
            scenery = addComp( Scenery );
            payoutTable = addComp( PayoutTable, {
                x: posXPayout, y: 215, scaleX: scaleXPayoutTable, scaleY: scaleYPayoutTable
            } );
            
            bellPanel = addComp( BellPanel, {x: 555, y: 75} );
            jackpot = addComp( JackpotPanel, {x: 540, y: 130} );
            balls = addComp( BallPanelMenton, {
                x: 0, y: 220, scaleX: scaleHandDevice, scaleY: scaleHandDevice
            } );
            buttons = addComp( ButtonPanel, {y: 712, x: 7} );
            cards = addComp( CardPanel, {x: 70, y: 255} );
            
            prizes = addComp( PrizePanel, {x: -20, y: posYPrizePanel} );
            
            autoplaypanel = addComp( new AutoPlayPanel( new CancelButton(), new CancelAutoButton(), MentonView.ME.setAutoPlay ), {
                x: 233, y: 710
            } );
            
            particles = addComp( ParticlesLayer );
            bonusGame = addComp( BonusGame );
            hide( bonusGame );
            
            if ( PraiaContext.ME.mobile && !PraiaContext.ME.oneHandDevice )
            {
                bonusGame.y = -30;
            }
            
            if ( PraiaContext.ME.oneHandExtended )
            {
                var offsetM3:int = 80;
                
                particles.y += offsetM3;
                bonusGame.y += offsetM3;
                
                jackpot.y += (offsetM3 + 20);
                
                payoutTable.y += (offsetM3 + 25);
                balls.y += (offsetM3 + 20);
                bellPanel.y += (offsetM3 + 25);
                
                cards.y += (offsetM3 + 30);
                prizes.y += (offsetM3 + 30);
                
                buttons.y += (offsetM3 + 50);
                autoplaypanel.y += (offsetM3 + 50);
                
                balls.tubing1.y += 20;
                balls.tubing2.y += 20;
            }
    
            addObject( new HowToPlayBox().draw() );
            HowToPlayBox.ME.setContent( new MentonHowToPlayContent() );
            
            if ( GameLevelsController.ME.isNoob( MentonVBB.ME ) )
            {
                var gth:GameTypeHint = addComp( GameTypeHint );
                gth.animateAutoMode( true );
            }
        }
        
        public function hideCards():void
        {
            //balls
            hide( buttons, cards, payoutTable );
            if ( jackpot ) hide( jackpot );
        }
        
        public function showCards():void
        {
            //balls
            show( buttons, cards, payoutTable );
            if ( jackpot )show( jackpot );
        }
    }
}