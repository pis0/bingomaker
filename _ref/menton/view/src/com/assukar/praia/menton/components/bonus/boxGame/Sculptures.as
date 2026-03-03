package com.assukar.praia.menton.components.bonus.boxGame 
{
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.assets.PraiaCommonAssets;
	import com.assukar.praia.domain.gameevents.PraiaGameEvents;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import com.assukar.praia.menton.domain.FeteDuCitroinBonusSession;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.AssukarJuggler;
	import com.assukar.view.starling.AssukarMovieClip;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	import flash.geom.Point;
	import starling.display.Image;
	import starling.textures.TextureSmoothing;


	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class Sculptures extends Component
	{
		public var currentScupture:int = 0;
		private var indexAnima:int = 0;
		
		//STAR
		private var sculpturesStar:Component;
		private var starWheelsComp:Component;
		private var stepsStar:Vector.<Image>;
		private var starWheels:Vector.<AssukarMovieClip>;
		private var starparticles:MentonParticle;
		// TUCAN
		private var sculpturesTucan:Component;
		private var tucanWheelsComp:Component;
		private var stepsTucan:Vector.<Image>;
		private var tucanWheels:Vector.<AssukarMovieClip>;
		private var tucanparticles:MentonParticle;
		//CRAB
		private var sculpturesGrable:Component;
		private var grableWheelsComp:Component;
		private var stepsGrable:Vector.<Image>;
		private var crabWheels:Vector.<AssukarMovieClip>;
		private var crabparticles:MentonParticle;
		
		private var cashHud:Vector.<Image>;
		private var cashPos:Point;
		private var valueCash:AssukarTextField;
		private var hudPosition:Point;
		private var particlesComplete:MentonParticle;
		private var particlesConfet:MentonParticle;
		public var onNextStep:Function;
		public var onCompleteStep:Function;
		private static const TOTAL_SCULPTURES:int = 3;
		private var sculpturesWon:Vector.<Array>;
		private var sculpturesWonPositions:Vector.<int>;
		private var sculpturesWonWheels:Vector.<Vector.<AssukarMovieClip>>;
		
		public var overSession:Boolean = false;
		
		public function Sculptures() {}
		
		public function init():void
		{
			currentScupture = 0;
			indexAnima = 0;
			
			resetSculptures(currentScupture);
			
			sculpturesWon = new Vector.<Array>();
			sculpturesWonPositions = new Vector.<int>();
			sculpturesWonWheels = new Vector.<Vector.<AssukarMovieClip>>();
			overSession = false;
			
		}
		
		override protected function draww():void 
		{
			super.draww();
			
			var i:int = 0;
			
			var emptyComp:Component = addComp(Component,{x:290, y:180});
			particlesComplete = new MentonParticle("mentonbonusfireworks", emptyComp);
			
			// TUCANO
			tucanWheelsComp = addComp(Component, { x:50, y:0 } );
			sculpturesTucan = addComp(Component, { x:50, y:0 } );
			tucanWheels = new Vector.<AssukarMovieClip>();
			tucanWheels.push(tucanWheelsComp.addMovie(MentonAssets.ME.textures("wheelA"),{ x:210, y:370, smoothing:TextureSmoothing.BILINEAR } ));
			tucanWheels.push(tucanWheelsComp.addMovie(MentonAssets.ME.textures("wheelB"),{ x:250, y:375, smoothing:TextureSmoothing.BILINEAR } ));
			tucanWheels.push(tucanWheelsComp.addMovie(MentonAssets.ME.textures("wheelA"), { x:285, y:360, smoothing:TextureSmoothing.BILINEAR } ));
			
			sculpturesTucan.addImage(MentonAssets.ME.texture("toucanoff"));
			stepsTucan = new Vector.<Image>();
			for ( i = 0; i < FeteDuCitroinBonusSession.TUCAN_LEMONS; i++) 
			{
				if((i + 1) <=9)
					stepsTucan.push(sculpturesTucan.addImage(MentonAssets.ME.texture("tucanlemon0" + (i + 1))));
				else
					stepsTucan.push(sculpturesTucan.addImage(MentonAssets.ME.texture("tucanlemon" + (i + 1))));
			}
			
			stepsTucan.push(sculpturesTucan.addImage(MentonAssets.ME.texture("toucanfull")));
			
			tucanparticles = new MentonParticle("bonusgruda", sculpturesTucan,180,80);
			
			//ESTRELA
			starWheelsComp = addComp(Component, { x:150, y:150 } );
			sculpturesStar = addComp(Component, { x:150, y:150 } );
			starWheels = new Vector.<AssukarMovieClip>();
			starWheels.push(starWheelsComp.addMovie(MentonAssets.ME.textures("wheelA"),{ x:35, y:230, smoothing:TextureSmoothing.BILINEAR } ));
			starWheels.push(starWheelsComp.addMovie(MentonAssets.ME.textures("wheelB"),{ x:130, y:240, smoothing:TextureSmoothing.BILINEAR } ));
			starWheels.push(starWheelsComp.addMovie(MentonAssets.ME.textures("wheelA"), { x:220, y:230, smoothing:TextureSmoothing.BILINEAR } ));
			
			sculpturesStar.addImage(MentonAssets.ME.texture("staroff"));
			stepsStar = new Vector.<Image>();
			for ( i = 0; i < FeteDuCitroinBonusSession.STAR_LEMONS; i++) 
				stepsStar.push(sculpturesStar.addImage(MentonAssets.ME.texture("starlemon0" + (i + 1))));
			
			stepsStar.push(sculpturesStar.addImage(MentonAssets.ME.texture("starfull")));
			
			starparticles = new MentonParticle("bonusgruda", starWheelsComp,130,50);
			
			// CARANGUEIJO
			grableWheelsComp = addComp(Component, { x:0, y:0 } );
			sculpturesGrable = addComp(Component, { x:0, y:0 } );
			crabWheels = new Vector.<AssukarMovieClip>();
			crabWheels.push(grableWheelsComp.addMovie(MentonAssets.ME.textures("wheelA"),{ x:10, y:410, smoothing:TextureSmoothing.BILINEAR } ));
			crabWheels.push(grableWheelsComp.addMovie(MentonAssets.ME.textures("wheelB"),{ x:130, y:450, smoothing:TextureSmoothing.BILINEAR } ));
			crabWheels.push(grableWheelsComp.addMovie(MentonAssets.ME.textures("wheelA"), { x:280, y:440, smoothing:TextureSmoothing.BILINEAR } ));
			crabWheels.push(grableWheelsComp.addMovie(MentonAssets.ME.textures("wheelB"), { x:360, y:440, smoothing:TextureSmoothing.BILINEAR } ));
			crabWheels.push(grableWheelsComp.addMovie(MentonAssets.ME.textures("wheelA"), { x:460, y:440, smoothing:TextureSmoothing.BILINEAR } ));
			crabWheels.push(grableWheelsComp.addMovie(MentonAssets.ME.textures("wheelB"), { x:600, y:400, smoothing:TextureSmoothing.BILINEAR } ));
			
			sculpturesGrable.addImage(MentonAssets.ME.texture("craboff"));
			stepsGrable = new Vector.<Image>();
			for ( i = 0; i < FeteDuCitroinBonusSession.CRAB_LEMONS; i++) 
			{
				if((i + 1)<=9)
					stepsGrable.push(sculpturesGrable.addImage(MentonAssets.ME.texture("grablemon0" + (i + 1))));
				else
					stepsGrable.push(sculpturesGrable.addImage(MentonAssets.ME.texture("grablemon" + (i + 1))));
			}
				
			stepsGrable.push(sculpturesGrable.addImage(MentonAssets.ME.texture("crabfull")));
			crabparticles = new MentonParticle("bonusgruda", sculpturesGrable,180,100);
			
			cashPos = new Point(230, 230);
			hudPosition = new Point ( -300, -300);
			
			cashHud = new Vector.<Image>();
			
			for (var j:int = 0; j <= 20; j++) 
				cashHud.push(addImage(PraiaCommonAssets.ME.texture("dindin106_sk"),{scale:0.75, x:cashPos.x,y:cashPos.y}));
			
			valueCash = addText(200, 100, "", Fonts.RUMPELSTILTSKIN, { fontSize:60, color:0xffffff, x:cashPos.x+10, y:cashPos.y-20} );
			particlesConfet = new MentonParticle("bonusconfeti", this , 290, -50);
		}
		
		override public function dispose():void 
		{
			//starparticles.stop();
			//starparticles = null;
			//
			//crabparticles.stop();
			//crabparticles = null;
			//
			//tucanparticles.stop();
			//tucanparticles = null;
			//
			//particlesComplete.stop();
			//particlesComplete = null;
			//
			//particlesConfet.stop();
			//particlesConfet = null;
			
			super.dispose();
		}
		
		public function resetSculptures(idSculpture:int):void
		{
			starWheelsComp.x = sculpturesStar.x = 150;
			tucanWheelsComp.x = sculpturesTucan.x = 50;
			grableWheelsComp.x = sculpturesGrable.x = 0;
			
			if (idSculpture < TOTAL_SCULPTURES)
			{
				switch (idSculpture) 
				{
					case 0:
						hideAll();
						showNewSculpture(sculpturesStar,starWheelsComp,starWheels);
					break;
					case 1:
						hideAll(false);
						walkOldSculpture(sculpturesStar,starWheelsComp,starWheels);
						showNewSculpture(sculpturesTucan,tucanWheelsComp,tucanWheels);
					break;
					case 2:
						hideAll(false);
						walkOldSculpture(sculpturesTucan,tucanWheelsComp,tucanWheels);
						showNewSculpture(sculpturesGrable,grableWheelsComp, crabWheels);
					break;
					
				}
				
				indexAnima = 0;
				
				if(valueCash)
					valueCash.text = "";
				
				resetCash(false);
			}
		}
		
		private function hideAll(cleanLemons:Boolean = true):void
		{
			var i:int = 0;
			
			if (cleanLemons)
			{
				for (i = 0; i < stepsStar.length; i++) 
					hide(stepsStar[i]);
				
				for (i = 0; i < stepsTucan.length; i++) 
					hide(stepsTucan[i]);
				
				for (i = 0; i < stepsGrable.length; i++) 
					hide(stepsGrable[i]);
			}
				
				
			for (i = 0; i < starWheels.length; i++) 
				stop(starWheels[i]);
			for (i = 0; i < tucanWheels.length; i++) 
				stop(tucanWheels[i]);
			for (i = 0; i < crabWheels.length; i++) 
				stop(crabWheels[i]);
				
			
			hide(sculpturesStar,sculpturesTucan,sculpturesGrable);
			stopWheels(sculpturesStar);
			stopWheels(sculpturesTucan);
			stopWheels(sculpturesGrable);
		}
		
		
		private var speedSculpture:Number = 1.5;
		private function showNewSculpture(currentSculpture:Component,currentWheelComp:Component,wheels:Vector.<AssukarMovieClip>):void
		{
			var saveX:int = currentSculpture.x;
			show(currentSculpture);
			
			currentSculpture.x += 700;
			currentWheelComp.x += 700;
			
			Sounds.ME.playFx(SoundID.BONUS_STATUE_MOVING, null, Sounds.LOOP, Sounds.SOUND_TRANSFORM_VOLUME_50);
			AssukarJuggler.ME.tween(currentSculpture,speedSculpture, { x:saveX, onComplete:stopWheels, onCompleteArgs:[currentSculpture,wheels] } );
			AssukarJuggler.ME.tween(currentWheelComp,speedSculpture, { x:saveX} );
			juggler.delayCall(Sounds.ME.stopFx, speedSculpture, SoundID.BONUS_STATUE_MOVING);
			
			for (var i:int = 0; i < wheels.length; i++) 
				playAnima(wheels[i]);
			
			playWheels(currentSculpture);
		}
		
		private function walkOldSculpture(currentSculpture:Component,currentWheelComp:Component,wheels:Vector.<AssukarMovieClip>):void
		{
			var saveX:int = currentSculpture.x;
			show(currentSculpture);
			
			Sounds.ME.playFx(SoundID.BONUS_STATUE_MOVING, null, Sounds.LOOP, Sounds.SOUND_TRANSFORM_VOLUME_50);
			AssukarJuggler.ME.tween(currentSculpture,speedSculpture, { x:saveX-800, onComplete:stopWheels, onCompleteArgs:[currentSculpture,wheels] } );
			AssukarJuggler.ME.tween(currentWheelComp,speedSculpture, { x:saveX-800} );
			juggler.delayCall(Sounds.ME.stopFx, speedSculpture, SoundID.BONUS_STATUE_MOVING);
			
			for (var i:int = 0; i < wheels.length; i++) 
				playAnima(wheels[i]);
			
			playWheels(currentSculpture);
		}
		
		
		public function update(lemons:int):void
		{
			switch (currentScupture) 
			{
				case 0:
					animateAddLemons(lemons, stepsStar,FeteDuCitroinBonusSession.STAR_LEMONS);
				break;
				case 1:
					animateAddLemons(lemons, stepsTucan,FeteDuCitroinBonusSession.TUCAN_LEMONS);
				break;
				case 2:
					animateAddLemons(lemons, stepsGrable,FeteDuCitroinBonusSession.CRAB_LEMONS);
				break;
				
			}
		}
		
		private function animateAddLemons(lemons:int,scutureAnimList:Vector.<Image>,max:int):void
		{
			var time:Number = 0.1;
			
			if (max == FeteDuCitroinBonusSession.STAR_LEMONS)
			{
				time = (lemons / 10) +  1;
				starparticles.start(time,0.5);
			}
			else if (max == FeteDuCitroinBonusSession.TUCAN_LEMONS)
			{
				time = (lemons / 10) +  1;
				tucanparticles.start(time,0.5);
			}
			else if(max == FeteDuCitroinBonusSession.CRAB_LEMONS)
			{
				time = (lemons / 10) +  1;
				crabparticles.start(time,0.5);
			}
			
			
			var total:int = indexAnima + lemons;
			var delay:Number = 0.5;
			var onMax:Boolean = false;
			
			if (total >= max)
			{
				total = max + 1;
				onMax = true;
			}
			
			Sounds.ME.playFx(SoundID.BONUS_LEMON_VUPT, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);
			for (var i:int = indexAnima; i < total; i++) 
			{
				scutureAnimList[i].alpha = 0;
				show(scutureAnimList[i]);
				
				juggler.delayCall(Sounds.ME.playFx, delay, SoundID.BONUS_LEMON_STICKING_MED, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_50);
				if(i == (total-1))
					AssukarJuggler.ME.tween(scutureAnimList[i], 0.2, { alpha:1, delay:delay, onComplete:checkNextSculpture, onCompleteArgs:[onMax] } );
				else
					AssukarJuggler.ME.tween(scutureAnimList[i], 0.2, { alpha:1, delay:delay} );
				
				delay += 0.2;
			}
			
			indexAnima = total;
		}
		
		private function checkNextSculpture(onMax:Boolean):void
		{	
			if (onMax)
			{
				PraiaGameEvents.MENTON_BONUS_SCULPTURE.dispatch();
				
				onCompleteStep(currentScupture);
				
				particlesComplete.start(1.3, 0.3);
				particlesComplete.particle.speed = 200;
				particlesComplete.particle.lifespan = .9;
				particlesComplete.particle.lifespanVariance = 2;
				
				particlesConfet.start(1.2,0.3);
				
				var value:int = 0;
				if (currentScupture == 0)
				{
					sculpturesWon.push([sculpturesStar,starWheelsComp]);
					sculpturesWonWheels.push(starWheels);
					value = FeteDuCitroinBonusSession.starPayout;
				}
				else if (currentScupture == 1)
				{
					sculpturesWon.push([sculpturesTucan,tucanWheelsComp]);
					sculpturesWonWheels.push(tucanWheels);
					value = FeteDuCitroinBonusSession.tucanPayout;
				}
				else if (currentScupture == 2)
				{
					sculpturesWon.push([sculpturesGrable,grableWheelsComp]);
					sculpturesWonWheels.push(crabWheels);
					value = FeteDuCitroinBonusSession.crabPayout;
				}
					
				AssukarJuggler.ME.delayCall(callOtherSculpture, 3);
				
				Sounds.ME.playFx(SoundID.BONUS_STATUE_COMPLETE, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);
			}
			else
			{
				onNextStep(currentScupture);
			}
			
			
		}
		
		public function callOtherSculpture():void
		{
			if (!overSession)
			{
				currentScupture++;
				if(currentScupture<TOTAL_SCULPTURES)
					resetSculptures(currentScupture);
			}
		}
		
//		private function animateCash(total:int):void
//		{
//			resetCash(true);
//			var delay:Number = 0.3;
//			
//			for (var i:int = 0; i < total; i++) 
//			{
//				if (i < 20)
//				{
//					AssukarJuggler.ME.tween(cashHud[i], 0.6,{x:hudPosition.x,y:hudPosition.y,delay:delay,onComplete:function():void{cashHud[i].visible = false;}});
//					delay += 0.1;
//				}
//			}
//		}
		
		private function resetCash(isVisible:Boolean = false):void
		{
			if (cashHud)
			{
				for (var i:int = 0; i < cashHud.length; i++) 
				{
					cashHud[i].x = cashPos.x;
					cashHud[i].y = cashPos.y;
					cashHud[i].visible = isVisible;
				}
			}
			
		}
		
		public function playWheels(currentSculpture:Component):void
		{
			AssukarJuggler.ME.tween(currentSculpture, 0.05, { y:currentSculpture.y - 3, onComplete:function():void {
				AssukarJuggler.ME.tween(currentSculpture, 0.05, { y:currentSculpture.y + 3, onComplete:playWheels,onCompleteArgs:[currentSculpture] } );
			}});
		}
		
		public function stopWheels(currentSculpture:Component,wheels:Vector.<AssukarMovieClip> = null):void
		{
			AssukarJuggler.ME.removeTweens(currentSculpture);
			
			if (wheels)
			{
				for (var i:int = 0; i < wheels.length; i++) 
					wheels[i].pause();
			}
		}
		
		
		public function showSculpturesWon():void
		{
			Sounds.ME.stopMusic();
			switch (sculpturesWon.length) 
			{
				case 1:
					sculpturesWonPositions.push(100);	
					moveCurrentSculptureLosted(sculpturesTucan,tucanWheelsComp,tucanWheels);
					Sounds.ME.playFx(SoundID.BONUS_END_1, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_50);
				break;
				case 2:
					sculpturesWonPositions.push(10);
					sculpturesWonPositions.push(230);
					moveCurrentSculptureLosted(sculpturesGrable,grableWheelsComp,crabWheels);
					Sounds.ME.playFx(SoundID.BONUS_END_2, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_50);
				break;
					
				case 3:
					sculpturesWonPositions.push(-30);
					sculpturesWonPositions.push(260);
					sculpturesWonPositions.push(0);
					Sounds.ME.playFx(SoundID.BONUS_END_3, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_50);
				break;
				default:
			}
			
			for (var i:int = 0; i < sculpturesWon.length; i++) 
			{
				for (var j:int = 0; j < sculpturesWonWheels[i].length; j++) 
					playAnima(sculpturesWonWheels[i][j]);
				
				playWheels(sculpturesWon[i][0]);
				show(sculpturesWon[i][0]);
				sculpturesWon[i][0].x = -200;
				sculpturesWon[i][1].x = -200;
				AssukarJuggler.ME.tween(sculpturesWon[i][0], 1, { x:sculpturesWonPositions[i]});
				AssukarJuggler.ME.tween(sculpturesWon[i][1], 1, { x:sculpturesWonPositions[i]});
			}
		}
		
		public function moveCurrentSculptureLosted(currentSculpture:Component,currentWheelComp:Component,wheels:Vector.<AssukarMovieClip>):void
		{
			currentWheelComp.x = currentSculpture.x;
			
			Sounds.ME.playFx(SoundID.BONUS_STATUE_MOVING, null, Sounds.LOOP, Sounds.SOUND_TRANSFORM_VOLUME_50);
			
			AssukarJuggler.ME.tween(currentSculpture,speedSculpture, { x:currentSculpture.x+800, onComplete:stopWheels, onCompleteArgs:[currentSculpture,wheels] } );
			AssukarJuggler.ME.tween(currentWheelComp,speedSculpture, { x:currentSculpture.x+800} );
			juggler.delayCall(Sounds.ME.stopFx, speedSculpture, SoundID.BONUS_STATUE_MOVING);
			
			for (var i:int = 0; i < wheels.length; i++) 
				playAnima(wheels[i]);
			
			playWheels(currentSculpture);
		}
		
	}

}