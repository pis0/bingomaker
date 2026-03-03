package com.assukar.praia.menton.components.balls
{
    import com.assukar.airong.error.AssukarError;
    import com.assukar.airong.text.TextUtils;
    import com.assukar.airong.utils.MathUtils;
    import com.assukar.airong.utils.Utils;
    import com.assukar.domain.domain.StatsMoney;
    import com.assukar.domain.services.dictio.Dictio;
    import com.assukar.praia.assets.Fonts;
    import com.assukar.praia.assets.PraiaCommonAssets;
    import com.assukar.praia.components.FontResolver;
    import com.assukar.praia.main.PraiaContext;
    import com.assukar.praia.menton.assets.MentonAssets;
    import com.assukar.praia.menton.components.particles.MentonParticle;
    import com.assukar.praia.menton.domain.MentonJackpotSession;
    import com.assukar.view.starling.AssukarMovieClip;
    import com.assukar.view.starling.Component;
    import com.assukar.view.starling.StarlingUtils;

import flash.display3D.Context3DBlendFactor;

import flash.geom.Point;
    import flash.geom.Rectangle;
    import flash.utils.Dictionary;
    

    import starling.animation.Transitions;
    import starling.animation.Tween;
    import starling.core.Starling;
    import starling.display.Image;
    import starling.display.MovieClip;
    import starling.display.Sprite3D;
    import starling.events.Event;
    import com.assukar.view.starling.AssukarTextField;
    import starling.text.TextFieldAutoSize;
    import starling.textures.Texture;
    import starling.textures.TextureSmoothing;
    import starling.utils.Align;
    
    public class BallPanelMenton extends Component
    {
        private var movieSplashContainer:Component;
        
        // EXTRA/SUPER BALLS
        public var extraBallsBackContainer:Component;
        private var extraBallsBack3DContainer:Sprite3D;
        private var extraBallsMergeContainer:Component;
        public var extraBallsFrontContainer:Component;
        public var extraBallsStakesContainer:Component;
        private var extraBallsStakesList:Vector.<Image>;
        // movie texture
        private var extraBallsTextureMovie:Component;
        private var extraBallsTextureMovieTex:Texture;
        // idle balls
        private var extraBallsIdleContainer:Component;
        private var extraBallsIdle:Component;
        
        //large ball
        private var largeBallContainer:Component;
        private var largeBallText:AssukarTextField;
        // extra / super / free
        public var extraPriceContainer:Component;
        private var extraPriceLabelText:AssukarTextField;
        private var extraPriceValueText:AssukarTextField;
        private var extraPriceStar:Image;
        private var extraPriceCoin:Image;
        private var extraPriceCash:Image;
        private var extraCover:Image;
        
        // REGULAR BALLS
        public var balls:Vector.<Ball> = new <Ball>[];
        private var ballContainer:Component;
        private var flattenedBallContainer:Component;
        private var water1Container:Component;
        private var water1:Component;
        private var water1FinalMovie:MovieClip;
        private var water2Container:Component;
        private var water2Movie:Water2Movie;
        private var water3Movie:MovieClip;
        private var water3MovieDelay:uint;
        private var ballCounter:BallCounter;
        private var textExtra:AssukarTextField;
        private var textSuperExtra:AssukarTextField;
        private var popperJuice:AssukarMovieClip;
        private var movieSplash:MovieSplash;
        private var idleLemon:IdleLemon;
        private var bgExtraText:Image;
        private var particleList:Vector.<MentonParticle>;
        
        // Jackpot Mark //
        private var mImageJackpotMark1:Image;
        private var mImageJackpotMark2:Image;
        private var mDictioJackptXPos:Dictionary = new Dictionary();
        // singleton
        static public var ME:BallPanelMenton;
        
        public var tubing1:Image;
        public var tubing2:Image;
        
        public function BallPanelMenton()
        {
            ME = singleton(ME);
        }
        
        override public function dispose():void
        {
            //for each (var p:MentonParticle in particleList)
            //{
            //p.stop();
            //p = null;
            //}
            
            hideExtraBgtextureMovie();
            
            //extraBallsTextureMovieTex.root.dispose();
            //extraBallsTextureMovieTex.dispose();
            //extraBallsTextureMovieTex = null;
            
            //for each (var b:Component in balls) b.dispose();
            //balls.length = 0;
            //balls = null;
            
            juggler.removeTweens(water1);
            juggler.removeTweens(water2Movie);
            juggler.removeTweens(water3Movie);
            juggler.removeByID(water3MovieDelay);
            juggler.removeTweens(extraCover);
            juggler.removeTweens(extraBallsBack3DContainer);
            juggler.removeByID(waterParticleDelay);
            juggler.removeTweens(extraBallsTextureMovie);
            juggler.removeTweens(water1Container.clipRect);
            
            super.dispose();
            ME = null;
        }
        
        public var extraBallsBackContainerBgStakes:Image;
        
        override protected function draww():void
        {
            extraBallsBackContainer = addComp(null, {x: 0, y: -140});
            
            var bg:Image = extraBallsBackContainer.addImage(MentonAssets.ME.texture("bgextraball"), {
                x: 150 + 20,
                y: 0,
                smoothing: TextureSmoothing.BILINEAR
            });
            
            extraBallsBackContainerBgStakes = extraBallsBackContainer.addImage(MentonAssets.ME.texture("bgextraball_full"), {
                x: bg.x,
                y: bg.y,
                smoothing: TextureSmoothing.BILINEAR
            });
            hide(extraBallsBackContainerBgStakes);
            
            extraBallsTextureMovie = extraBallsBackContainer.addComp(null, {x: 173, y: 3, alpha: 0.66});
            extraBallsTextureMovie.clipRect = new Rectangle(0, 0, 370, 126);
            extraBallsTextureMovieTex = MentonAssets.ME.texture("textura_painelbolaextra");
            
            var i:int = 0; //
            var imgTemp:Image;
            for (; i < 16; i++)
            {
                imgTemp = extraBallsTextureMovie.addImage(extraBallsTextureMovieTex, {smoothing: TextureSmoothing.BILINEAR});
                imgTemp.pivotRatioX = 0.5;
                imgTemp.pivotRatioY = 1.0;
                imgTemp.scale = 2.0 - (1.5 * Math.random());
                imgTemp.alpha = MathUtils.getRandonBetween(.3, .65);
                imgTemp.rotation = (Math.PI * 2) * Math.random();
            }
            //stakes
            extraBallsStakesContainer = extraBallsBackContainer.addComp(null, {x: 156 + 20, y: 8});
            extraBallsStakesList = new <Image>[];
            i = 0;
            var temp:Image;
//			var tempBg:Image = createImage(MentonAssets.ME.texture("bgextrabalv2l"), {smoothing: TextureSmoothing.BILINEAR});
//			Utils.print(tempBg.width + ":" + tempBg.height);
            //for (; i < 12; i++)
            for (; i < 10; i++)
            {
//				temp = extraBallsStakesList[i] = extraBallsStakesContainer.addComp();
                temp = extraBallsStakesList[i] = extraBallsStakesContainer.addImage(MentonAssets.ME.texture("extragratis"), {smoothing: TextureSmoothing.BILINEAR});
                temp.x = 10 + (61 * 5) - (61 + 15) * int(i / 2);
                temp.y = 8 + (59 * 1) - 59 * (i % 2);
//				temp.addImage(MentonAssets.ME.texture("extragratis"), {centerRelativeTo: tempBg, smoothing: TextureSmoothing.BILINEAR});
//				temp.pos( //
//				(tempBg.width * 5) - (tempBg.width + 15) * int(i / 2), // 					
//				(tempBg.height * 1) - tempBg.height * (i % 2) //  
//				);
            }
            hide(extraBallsStakesContainer);
            
            // 3D container
            extraBallsBack3DContainer = addObject(new Sprite3D(), {x: 357, y: -73});
            extraBallsBack3DContainer.addChild(extraBallsBackContainer);
            extraBallsBackContainer.x = -357;
            extraBallsBackContainer.y = -67;
            
            extraBallsMergeContainer = addComp(null, {x: -357, y: 73});
            extraBallsBack3DContainer.addChild(extraBallsMergeContainer);
            // container back
            tubing2 = addImage(MentonAssets.ME.texture("ballcontainer2"), {x: 0, y: 340});
            
            ballContainer = addComp();
            flattenedBallContainer = addComp();
            
            var b:Ball;
            i = 0;
            for (; i < 90; i++)
            {
                b = balls[i] = ballContainer.addComp(new Ball(i + 1));
                b.visible = false;
            }
            
            //particle container 1
            var particlesContainer1:Component = addComp();
            
            water1Container = addComp();
            water1Container.clipRect = new Rectangle(12, 66, 45, 413 + (PraiaContext.ME.oneHandExtended ? 20 : 0));
            water1 = water1Container.addComp(null, {x: -6, y: -680 - 2772, alpha: 0.25});
            water1.addImage(MentonAssets.ME.texture("liquido_fim"), {y: -40});
            
            for (i = 0; i < 10; i++)
                water1.addImage(MentonAssets.ME.texture("liquido_meio"), {y: 200 + (308 * i)});
            
            water1.addImage(MentonAssets.ME.texture("liquido_inicio"), {y: 500 + 2772});
            water1.flatten();
            water1FinalMovie = water1Container.addMovie(MentonAssets.ME.textures("gotas_final"), {x: 5, y: 67});
            
            //water2
            water2Container = addComp(null, {x: 11, y: 441 + (PraiaContext.ME.oneHandExtended ? 20 : 0)});
            water2Container.clipRect = new Rectangle(4, -10, 734, 52);
            water2Movie = water2Container.addComp(Water2Movie, {alpha: 0.8});
            
            //water3
            water3Movie = water2Container.addMovie(MentonAssets.ME.textures("splash"), {
                x: 9 - 11,
                y: 434 - 441 + (PraiaContext.ME.oneHandExtended ? 20 : 0)
            });
            water3Movie.fps = 60;
            
            // counter
            addImage(MentonAssets.ME.texture("ballpipe"), {x: -6});
            ballCounter = addComp(BallCounter, {x: 18, y: 20, name: "counter"});
            
            // container front
            tubing1 = addImage(MentonAssets.ME.texture("ballcontainer1"), {x: 0, y: 340});
            
            // EXTRA/SUPER BALLS - FRONT
            extraBallsFrontContainer = addComp(null, {x: 0, y: -140});
            extraBallsFrontContainer.addImage(MentonAssets.ME.texture("fundopipoqueira"), {x: 0, y: 20});
            
            // idle balls
            extraBallsIdleContainer = extraBallsFrontContainer.addComp(null, {x: 33, y: 23});
            extraBallsIdle = extraBallsIdleContainer.addComp(null, {x: 38, y: 48, name: "ide"});
            idleLemon = extraBallsIdle.addComp(IdleLemon, {x: 0});
            
            mImageJackpotMark1 = addImage(MentonAssets.ME.texture("jackbar1"), {x: 4, y: 378, visible: false});
            mImageJackpotMark2 = extraBallsFrontContainer.addImage(MentonAssets.ME.texture("jackbar2"), {
                visible: false,
                name: "jbar"
            });
            
            // extra / super / free
            extraPriceContainer = extraBallsFrontContainer.addComp();
            extraPriceLabelText = extraPriceContainer.addText(82, 30, Dictio.upper("free"), Fonts.MYRIADPRO_SEMIBOLD, {
                name: "free",
                x: 42,
                y: 72
            }, {fontSize: 32, color: 0xffffff}, {visible: false, resizeOffset: true});
            extraPriceStar = extraPriceContainer.addImage(MentonAssets.ME.texture("extragratis"), {
                name: "star",
                x: 62,
                y: 32
            });
            extraPriceCoin = extraPriceContainer.addImage(PraiaCommonAssets.ME.texture("ficha57_sk"), {
                scale: 0.75,
                name: "coin",
                x: 68,
                y: 40,
                smoothing: TextureSmoothing.BILINEAR
            });
            extraPriceCash = extraPriceContainer.addImage(PraiaCommonAssets.ME.texture("dindin77_sk"), {
                name: "dindin",
                x: 62,
                y: 43,
                smoothing: TextureSmoothing.BILINEAR,
                scale: 0.75
            });
            extraPriceValueText = extraPriceContainer.addText(30, 40, "", Fonts.MYRIADPRO_SEMIBOLD, {
                name: "numm",
                x: 43,
                y: 67
            }, {fontSize: 32, color: 0xffffff, hAlign: Align.LEFT, autoSize: TextFieldAutoSize.HORIZONTAL});
            
            // large ball
            largeBallContainer = extraBallsFrontContainer.addComp(null, {x: 40, y: 29});
            var largeBallImg:Image = largeBallContainer.addImage(MentonAssets.ME.texture("bigballv2"));
            largeBallText = largeBallContainer.addText(largeBallImg.width, largeBallImg.height, "", Fonts.IOWAN_BLACK, {
                x: 42,
                y: 42,
                centerPivots: true
            }, {color: 0x4d371e, fontSize: 50, letterSpacing: -2});
            
            movieSplashContainer = extraBallsFrontContainer.addComp(Component);
            movieSplash = movieSplashContainer.addComp(MovieSplash, {name: "splash", x: 406, y: 62});
            popperJuice = movieSplashContainer.addMovie(MentonAssets.ME.textures("pipo_juice"), {
                name: "pipo",
                x: 36,
                y: 25
            });
            
            extraBallsFrontContainer.addImage(MentonAssets.ME.texture("tampapipoqueira"), {x: 0, y: 20});
            extraCover = extraBallsFrontContainer.addImage(MentonAssets.ME.texture("bigballpipe2"), {
                x: 141,
                y: 32,
                pivotX: 5,
                pivotY: 8,
                smoothing: TextureSmoothing.BILINEAR
            });
            
            // particles
            const particlePosList:Vector.<Point> = new <Point>[ //
                new Point(145, -95), //
                new Point(145, -35), //
                new Point(32, 77), //
                new Point(33, 77) //
            ];
            particleList = new <MentonParticle>[];
            i = 0;
            for (; i < 4; i++)
            {
                particleList[i] = new MentonParticle("water", ((i < 3) ? particlesContainer1 : this), particlePosList[i].x, particlePosList[i].y);
            }
            
            bgExtraText = addImage(MentonAssets.ME.texture("bgextraball"), {
                x: 150 + 20,
                y: -140,
                smoothing: TextureSmoothing.BILINEAR,
                visible: false
            });
            textExtra = addText(bg.width, 80, Dictio.upper("Extra"), FontResolver.ME.resolveFontName(Fonts.IOWAN_BLACK), {
                fontSize: 70,
                color: 0xfff000,
                resizeOffset: true,
                visible: false
            });
            StarlingUtils.centerRelativeTo(textExtra, bg);
            
            textSuperExtra = addText(bg.width, 80, Dictio.upper("Super"), FontResolver.ME.resolveFontName(Fonts.IOWAN_BLACK), {
                fontSize: 74,
                color: 0x00fcff,
                resizeOffset: true,
                visible: false
            });
            StarlingUtils.centerRelativeTo(textSuperExtra, bg);
            
            initPosPopper = new Point(extraBallsFrontContainer.x, extraBallsFrontContainer.y);
            
            state = STATE_IDLE;
            
            if (!mDictioJackptXPos) mDictioJackptXPos = new Dictionary();
            mDictioJackptXPos[32] = new Point(472, -7);
            mDictioJackptXPos[34] = new Point(396, -7);
            mDictioJackptXPos[36] = new Point(320, -7);
            mDictioJackptXPos[38] = new Point(243, -7);
            
        }
        
        private var initPosPopper:Point;
        private var callBackMovie:Function;
        
        public function playSplash(text:String, callBack:Function):void
        {
            hide(extraPriceContainer);
            
            callBackMovie = callBack;

            movieSplash.reset();
            movieSplash.setText(text);
            movieSplash.setBallNumber(largeBallText.text);
            
            show(popperJuice);
            playAnima(popperJuice, 1, shakePopper);
        }
        
        private function shakePopper(event:Event):void
        {
            show(popperJuice);
            popperJuice.moveToLastFrame();
            
            juggler.tween(extraBallsFrontContainer, .05, {x: initPosPopper.x + 1, y: initPosPopper.y + 1});
            juggler.tween(extraBallsFrontContainer, .05, {delay: .05, x: initPosPopper.x - 2, y: initPosPopper.y - 2});
            juggler.tween(extraBallsFrontContainer, .05, {delay: .1, x: initPosPopper.x + 1, y: initPosPopper.y - 1});
            juggler.tween(extraBallsFrontContainer, .05, {delay: .15, x: initPosPopper.x - 1, y: initPosPopper.y + 1});
            juggler.tween(extraBallsFrontContainer, .05, {delay: .2, x: initPosPopper.x + 2, y: initPosPopper.y - 2});
            juggler.tween(extraBallsFrontContainer, .05, {delay: .25, x: initPosPopper.x - 1, y: initPosPopper.y - 1});
            juggler.tween(extraBallsFrontContainer, .05, {
                delay: .28,
                x: initPosPopper.x,
                y: initPosPopper.y,
                onComplete: resetPos,
                onCompleteArgs: [initPosPopper]
            });
        }
        
        private function resetPos(pos:Point):void
        {
            extraBallsFrontContainer.x = pos.x;
            extraBallsFrontContainer.y = pos.y;
            
            largeBallContainer.visible = false;
            
            if (extraCoverIsOpen) closeExtraCover();
            
            openExtraCover();
            movieSplash.play();
            
            delayCall("hideJuice", juggler.delayCall(hide, .3, popperJuice));
            
            if (state != STATE_EXTRA || state != STATE_SUPER)
                delayCall("closeCover", juggler.delayCall(closeExtraCover, 2.4));
            
            delayCall("completeMovie", juggler.delayCall(completeMovieSplah, 2.8));
        }
        
        
        private function completeMovieSplah():void
        {
            callBackMovie();
            show(extraPriceContainer);
        }
        
        private function showText(text:AssukarTextField):void
        {
            text.y = 0;
            bgExtraText.alpha = text.alpha = 0;
            show(text, bgExtraText);
            
            juggler.tween(bgExtraText, .3, {alpha: .8, transition: Transitions.EASE_IN_SINE});
            juggler.tween(text, .3, {
                alpha: 1, y: -108, transition: Transitions.EASE_IN_SINE, onComplete: function ():void
                {
                    juggler.tween(bgExtraText, .2, {delay: .5, alpha: 0, transition: Transitions.EASE_OUT_SINE});
                    juggler.tween(text, .2, {
                        delay: .5,
                        alpha: 0,
                        y: -190,
                        transition: Transitions.EASE_OUT_SINE,
                        onComplete: hide,
                        onCompleteArgs: [text, bgExtraText]
                    });
                    
                }
            });
        }
        
        // extra bg texture movie
        private var extraBgTextureMovieIsRunning:Boolean = false;
        
        public function showExtraBgTextureMovie():void
        {
            if (extraBgTextureMovieIsRunning || extraBallsStakesContainer.visible) return;
            
            extraBgTextureMovieIsRunning = true;
            
            var i:uint, //
                    len:uint = extraBallsTextureMovie.numChildren, //
                    imgTemp:Image;
//			var tl:Vector.<Tween> = new <Tween>[];
            for (i; i < len; i++)
            {
                imgTemp = extraBallsTextureMovie.getChildAt(i) as Image;
                
                imgTemp.x = -imgTemp.width;
                imgTemp.y = uint((extraBallsTextureMovie.clipRect.height * 2) * Math.random());
                
                juggler.removeTweens(imgTemp);
                var imgTempTween:Tween = juggler.create(imgTemp, 16.0, { //
                    x: extraBallsTextureMovie.clipRect.width + imgTemp.width, //
                    repeatCount: int.MAX_VALUE, //
                    onUpdateArgs: [imgTemp, Math.round(Math.random())], //
                    onUpdate: function (target:Image, cond:uint):void
                    {
                        target.rotation += .010006 * ((cond) ? 1 : -1);
                    }
                });
                imgTempTween.advanceTime((16.0 / len) * i);
                juggler.add(imgTempTween);
                
            }
            show(extraBallsTextureMovie);
            
            juggler.removeTweens(extraBallsTextureMovie);
            extraBallsTextureMovie.alpha = 0;
            juggler.tween(extraBallsTextureMovie, .3, {alpha: 0.66});
        }
        
        public function hideExtraBgtextureMovie():void
        {
            var i:uint, //
                    len:uint = extraBallsTextureMovie.numChildren;
            for (i; i < len; i++)
            {
                juggler.removeTweens(extraBallsTextureMovie.getChildAt(i) as Image);
            }
            
            juggler.removeTweens(extraBallsTextureMovie);
            hide(extraBallsTextureMovie);
            
            extraBgTextureMovieIsRunning = false;
        }
        
        // extra idle balls
        public function showExtraIdleBalls():void
        {
            show(extraBallsIdleContainer);
            idleLemon.playParticles();
            startRandonDrop();
        }
        
        private function startRandonDrop(event:Event = null):void
        {
            delayCall("dropIdle", juggler.delayCall(dropIdleWater, 5 + Math.random() * 8));
        }
        
        private function dropIdleWater():void
        {
            playAnima(water1FinalMovie, 1, startRandonDrop);
        }
        
        public function hideExtraIdleBalls():void
        {
            destroyCall("dropIdle");
            idleLemon.stopParticles();
            hide(extraBallsIdleContainer);
        }
        
        // particles
        public function extraWaterParticle():void
        {
            var i:int = 0;
            var temp:MentonParticle;
            for (; i < 2; i++)
            {
                
                temp = particleList[i];
                temp.stop();
                temp.start(.166 * Math.random());
                temp.pos(145, -85 + uint(50 * Math.random()));
                temp.particle.speed = 50 + (100 * Math.random());
                temp.particle.emitAngleVariance = 0;
                temp.particle.emitterYVariance = 10;
                temp.particle.emitterXVariance = 0;
                temp.particle.emitAngle = 0.0;
                temp.particle.startSize = 10;
                temp.particle.endSize = 5;
                temp.particle.lifespan = 1.4;
                temp.particle.blendFactorDestination = Context3DBlendFactor.ONE;
            }
        }
        
        private var waterParticleDelay:uint;
        
        public function waterParticle(isShortMovie:Boolean = false):void
        {
            var temp2:MentonParticle = particleList[2];
            temp2.stop();
            temp2.start(!isShortMovie ? 4 : 1);
            temp2.pos(34, 77);
            temp2.particle.speed = 700;
            temp2.particle.emitAngleVariance = 0;
            temp2.particle.emitterYVariance = 0;
            temp2.particle.emitterXVariance = 10;
            temp2.particle.emitAngle = 1.55;
            temp2.particle.startSize = 50;
            temp2.particle.endSize = 5;
            temp2.particle.lifespan = 1.4;
            temp2.particle.blendFactorDestination = Context3DBlendFactor.ONE;
            
            var obj:Object = {speed: 200, startSize: 12, emitterXVariance: 16};
            juggler.tween(obj, 0.6666, {
                speed: 200, startSize: 12, emitterXVariance: 16, onUpdate: function ():void
                {
					if(temp2 && temp2.particle && obj){
						temp2.particle.speed = obj.speed;
						temp2.particle.startSize = obj.startSize;
						temp2.particle.emitterXVariance = obj.emitterXVariance;
					}
                    
                }, delay: !isShortMovie ? 2.555 : 0
            });
            
            if (isShortMovie)
            {
                juggler.removeByID(waterParticleDelay);
                waterParticleDelay = juggler.delayCall(water1Container.playAnima, .4, water1FinalMovie, Math.random() < 0.5 ? 2 : 1);
            }
            
        }
        
        // peeling
        private var isPeeling:Boolean;
        private var peelingBall:Ball;
        
        public function peel(ball:int, step:int, callback:Function = null):void
        {
            isPeeling = true;
            
            if (extraCoverIsOpen)
            {
                closeExtraCover(function ():void
                {
                    peelStep(ball, step, callback);
                });
            }
            else
            {
                peelStep(ball, step, callback);
            }
        }
        
        private function peelStep(ball:int, step:int, callback:Function = null):void
        {
            peelingBall = BallPanelMenton.ME.balls[ball];
            
            if (!peelingBall.extra) peelingBall.extra = true;
            peelingBall.rotation += Math.PI * Math.random();
            peelingBall.scale = 1.3;
            peelingBall.x = (step == 0) ? 135 : 107 + ((28 / 6) * (7 - step));
            peelingBall.y = -70;
            show(peelingBall);
            
            const r:Number = (step == 0) ? -2.2 : (-0.11 * (7 - step));
            
            juggler.removeTweens(extraCover);
            juggler.tween(extraCover, .222, { //
                rotation: r, //
                delay: (step == 0) ? .15 : 0, //
                transition: Transitions.EASE_OUT_BACK, //
                onComplete: function ():void
                {
                    if (step != 0) juggler.tween(extraCover, .2, {
                        repeatCount: int.MAX_VALUE,
                        reverse: true,
                        rotation: r - 0.05
                    });
                    if (callback) callback();
                } //
            });
            
            extraWaterParticle();
            
        }
        
        // 3d container hit
        public function beatExtraBallContainer(spot:uint):void
        {
            Starling.current.stage.projectionOffset = new Point(0, -300);
            
            juggler.removeTweens(extraBallsBack3DContainer);
            juggler.tween(extraBallsBack3DContainer, .1333, {
                rotationX: 0.05 * (spot % 2 ? -1 : 1),
                rotationY: 0.05 * (spot > 5 ? 1 : -1),
                onComplete: function ():void
                {
                    juggler.tween(extraBallsBack3DContainer, .5, {
                        rotationX: 0,
                        rotationY: 0,
                        transition: Transitions.EASE_OUT_ELASTIC
                    });
                }
            });
            
            beatIdleBalls(true, spot);
        }
        
        public function mergeExtraBallWith3DContainer(ball:Ball):void
        {
//			if (ball.parent) ball.parent.removeChild(ball);
            ball.visible = true;
//			ball.unflatten();
            extraBallsMergeContainer.addChild(ball);
        }
        
        // counter
        public function setTriggersBalls(ball:int):void
        {
            ballCounter.setTriggersBalls(ball);
        }
        
        // small balls
        public function dropWater():void
        {
            juggler.removeTweens(water1);
            water1.y = -680 - 2772;
            juggler.tween(water1, 3, {
                y: 520 + (PraiaContext.ME.oneHandExtended ? 20 : 0), //
                onComplete: function ():void
                {
					if(water1Container){
						water1Container.clipRect = null;
						water1Container.clipRect = new Rectangle(12, 66, 45, 413 + (PraiaContext.ME.oneHandExtended ? 20 : 0));
						water1Container.playAnima(water1FinalMovie, Math.random() < 0.5 ? 2 : 1);
					}
                }
            });
            
            water1Container.clipRect = null;
            water1Container.clipRect = new Rectangle(23, 66, 0, 413 + (PraiaContext.ME.oneHandExtended ? 20 : 0));
            juggler.tween(water1Container.clipRect, .2, {
                x: 12, width: 45, onComplete: function ():void
                {
					if(water1Container){
						juggler.tween(water1Container.clipRect, .10006, {
							x: 12 + 5,
							width: 45 - 10,
							repeatCount: int.MAX_VALUE,
							reverse: true
						});
					}
                }
            });
            
            juggler.removeTweens(water2Movie);
            water2Movie.speed = 8.0001;
            water2Movie.play();
            water2Movie.y = 30;
            juggler.tween(water2Movie, 2.5555, {
                y: 15, onComplete: function ():void {
					if(water2Movie){
						water2Movie.speed = 8.0001;
						juggler.tween(water2Movie, 2, {
							y: 30, onComplete: function ():void {
								if (water2Movie){
									water2Movie.stop();
								}
							}
						});
					}
                    
                }, onUpdate: function ():void
                {
                    water3Movie.y = water2Movie.y - 25;
                }
            });
            
            juggler.removeByID(water3MovieDelay);
            water3MovieDelay = juggler.delayCall(function ():void {
				if (water3Movie){
					playAnima(water3Movie, 10);
				}
            }, 0.3);
            
            waterParticle();
        }
        
        public function beatIdleBalls(onlyExtraBalls:Boolean = false, extraSpot:uint = 0):void
        {
            for each (var b:Ball in balls)
            {
                if (b.idle)
                {
                    if (!onlyExtraBalls || (onlyExtraBalls && b.extra))
                        b.shake(onlyExtraBalls, extraSpot);
                }
            }
        }
        
        // large balls
        public function updateLargeBall(ballNumber:uint):void
        {
            if (!largeBallContainer.visible) largeBallContainer.visible = true;
            
            largeBallText.text = (ballNumber < 10 ? "0" : "") + ballNumber;
        }
        
        public function hideExtraPrice():void
        {
            hide(extraPriceValueText, extraPriceCash, extraPriceCoin);
        }
        
        // extra prices/free
        public function updateExtraPrice(stake:StatsMoney):void
        {
            show(extraPriceValueText);
            if (stake.cash > 0)
            {
                extraPriceValueText.text = TextUtils.formatNumber(stake.cash);
                StarlingUtils.centerXRelativeTo(extraPriceValueText, extraPriceCash);
                show(extraPriceCash);
                hide(extraPriceCoin);
            }
            else if (stake.coins > 0)
            {
                extraPriceValueText.text = TextUtils.formatNumber(stake.coins);
                StarlingUtils.centerXRelativeTo(extraPriceValueText, extraPriceCoin);
                hide(extraPriceCash);
                show(extraPriceCoin);
            }
            
        }
        
        // extra stakes
        public function updateExtraStakes(extraStakes:Vector.<StatsMoney>):void
        {
            var i:uint = 0,//
                    len:uint = extraBallsStakesList.length, //
//			temp:Component, //
                    tempStake:StatsMoney;
            for (; i < len; i++)
            {
                tempStake = extraStakes[i];
//				temp = extraBallsStakesList[i];
                extraBallsStakesList[i].visible = tempStake && (!tempStake.coins && !tempStake.cash);
//				temp.getChildAt(1).visible = tempStake && (!tempStake.coins && !tempStake.cash); 
            }
        }
        
        // cover
        private var extraCoverIsOpen:Boolean;
        
        private function openExtraCover(callback:Function = null):void
        {
            if (extraCoverIsOpen || isPeeling) return;
            
            juggler.removeTweens(extraCover);
            juggler.tween(extraCover, 1, {
                rotation: -2.2, transition: Transitions.EASE_OUT_BACK, onComplete: function ():void
                {
                    if (callback != null) callback();
                }
            });
            extraCoverIsOpen = true;
        }
        
        private function closeExtraCover(callback:Function = null):void
        {
            juggler.removeTweens(extraCover);
            juggler.tween(extraCover, .2, {
                rotation: 0, onComplete: function ():void
                {
                    if (callback != null) callback();
                }
            });
            
            extraCoverIsOpen = false;
        }
        
        // state
        static public const STATE_IDLE:uint = 1 << 0;
        static public const STATE_REGULAR:uint = 1 << 1;
        static public const STATE_EXTRA:uint = 1 << 2;
        static public const STATE_FREE:uint = 1 << 3;
        static public const STATE_SUPER:uint = 1 << 4;
        private var statee:uint;
        private var showTextExtraOnce:Boolean;
        private var showTextSuperOnce:Boolean;
        
        public function get state():uint
        {
            return this.statee;
        }
        
        public function set state(value:uint):void
        {
            this.statee = value;
            
            resetPanel();
            hideExtraStakes();
            
            if (state & STATE_IDLE)
            {
                showTextSuperOnce = showTextExtraOnce = true;
                closeExtraCover();
                showExtraBgTextureMovie();
                showExtraIdleBalls();
                hideJackpotMarks();
            }
            else if (state & STATE_REGULAR)
            {
                show(largeBallContainer);
                showExtraBgTextureMovie();
            }
            else if (state & STATE_EXTRA)
            {
                hideExtraBgtextureMovie();
                
                var delay:Number = 0;
                
                if (showTextExtraOnce)
                {
                    delay = 1;
                    showTextExtraOnce = false;
                    showText(textExtra);
                }
                
                delayCall("extraState", juggler.delayCall(show, delay, extraBallsStakesContainer, extraPriceContainer, extraBallsBackContainerBgStakes));//
                delayCall("showJackpotMarks", juggler.delayCall(showJackpotMarks, delay));//
                
                openExtraCover();
            }
            else if (state & STATE_FREE)
            {
                hide(extraPriceCash, extraPriceCoin, extraPriceValueText);
                show(extraPriceStar, extraBallsStakesContainer, extraPriceLabelText, extraPriceContainer, extraBallsBackContainerBgStakes);
                openExtraCover();
            }
            else if (state & STATE_SUPER)
            {
                if (showTextSuperOnce)
                {
                    showTextSuperOnce = false;
                    showText(textSuperExtra);
                }
                
                show(extraBallsStakesContainer, extraPriceContainer, extraBallsBackContainerBgStakes);//extraPriceValueContainer
                openExtraCover();
            }
            else throw new AssukarError(state + " is an invalid state");
            
        }
        
        public function hideExtraStakes():void
        {
            destroyCall("extraState");
            hide(extraPriceLabelText, extraPriceStar, extraPriceContainer);
        }
        
        private function resetPanel():void
        {
            hideExtraIdleBalls();
            
            isPeeling = false;
            
            hide(largeBallContainer);
        }
        
        public function updateJackpotMarkPos():void
        {
            if (!MentonJackpotSession.ME)
            {
                hide(mImageJackpotMark1, mImageJackpotMark2);
                return;
            }
            
            switch (MentonJackpotSession.ME.ballsToJackpot)
            {
                case 30:
                    break;
                case 32:
                    mImageJackpotMark2.x = mDictioJackptXPos[32].x;
                    mImageJackpotMark2.y = mDictioJackptXPos[32].y;
                    break;
                case 34:
                    mImageJackpotMark2.x = mDictioJackptXPos[34].x;
                    mImageJackpotMark2.y = mDictioJackptXPos[34].y;
                    break;
                case 36:
                    mImageJackpotMark2.x = mDictioJackptXPos[36].x;
                    mImageJackpotMark2.y = mDictioJackptXPos[36].y;
                    break;
                case 38:
                    mImageJackpotMark2.x = mDictioJackptXPos[38].x;
                    mImageJackpotMark2.y = mDictioJackptXPos[38].y;
                    break;
                default:
                    if (MentonJackpotSession.ME.ballsToJackpot > 38)
                    {
                        show(mImageJackpotMark2);
                        hide(mImageJackpotMark1);
                        mImageJackpotMark2.x = mDictioJackptXPos[38].x;
                        mImageJackpotMark2.y = mDictioJackptXPos[38].y;
                        
                    }
                    else hide(mImageJackpotMark1, mImageJackpotMark2);
            }
        }
        
        public function showJackpotMarks():void
        {
            if (!MentonJackpotSession.ME)
            {
                hide(mImageJackpotMark1, mImageJackpotMark2);
                return;
            }
            
            switch (MentonJackpotSession.ME.ballsToJackpot)
            {
                case 30:
                    show(mImageJackpotMark1);
                    hide(mImageJackpotMark2);
                    break;
                case 32:
                case 34:
                case 36:
                case 38:
                    show(mImageJackpotMark2);
                    hide(mImageJackpotMark1);
                    break;
                default:
                    hide(mImageJackpotMark1, mImageJackpotMark2);
            }
        }
        
        public function hideJackpotMarks():void
        {
            hide(mImageJackpotMark1, mImageJackpotMark2);
        }
        
        public function reset():void
        {
            juggler.removeByID(waterParticleDelay);
            juggler.removeTweens(extraCover);
            
            hide(extraBallsStakesContainer);
            hide(extraBallsBackContainerBgStakes);
            
            ballCounter.reset();
            
            juggler.removeTweens(water1);
            water1.y = -680 - 2772;
            water1Container.stop(water1FinalMovie);
            
            juggler.removeTweens(water2Movie);
            water2Movie.stop();
            water2Movie.y = 13;
            
            juggler.removeByID(water3MovieDelay);
            stop(water3Movie);
            
            for each (var b:Ball in balls)
            {
                b.reset();
                ballContainer.addChild(b);
            }
          //  flattenedBallContainer.unflatten();
            
            state = STATE_IDLE;
        }
        
        public function notifyEndOfDefaultRound():void
        {
			//Utils.print("FLATTEN BALL CONTAINER");
            for each (var b:Ball in balls) if (b.visible)
            {
                flattenedBallContainer.addChild(b);
            }
          //  flattenedBallContainer.flatten();
        }
    }
}


import com.assukar.praia.menton.assets.MentonAssets;
import com.assukar.view.starling.Component;

import starling.rendering.Painter;
import starling.textures.Texture;
import starling.textures.TextureSmoothing;

internal class Water2Movie extends Component
{
    
    override public function dispose():void
    {
        //texture.root.dispose();
        //texture.dispose();
        //texture = null;
        
        super.dispose();
    }
    
    private var container:Component;
    private var texture:Texture;
    
    function Water2Movie()
    {
        
        container = addComp();
        
        texture = MentonAssets.ME.texture("liquido_tanque_loop");
        container.addImage(texture, {smoothing: TextureSmoothing.BILINEAR});
        container.addImage(texture, {x: texture.width, smoothing: TextureSmoothing.BILINEAR});
        
        container.x = -texture.width;
        
        speed = 10;
    }
    
    private var playing:Boolean;
    public var speed:Number;
    
    override public function play(...animas):void
    {
        playing = true;
    }
    
    override public function stop(...animas):void
    {
        playing = false;
    }
    
    override public function render(painter:Painter):void
    {
        if (!playing) return;
        
        super.render(painter);
        
        container.x += speed;
        if (container.x >= 0) container.x = -texture.width;
        
    }
    
}
