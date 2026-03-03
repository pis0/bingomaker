package com.assukar.praia.menton.components.bonus.boxGame 
{
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.domain.FeteDuCitroinBonusSession;
	import com.assukar.view.starling.AssukarJuggler;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.TouchableComponent;
	import flash.geom.Point;
	
	import starling.animation.Transitions;
	import starling.display.Image;
	import starling.events.Touch;
	import starling.textures.TextureSmoothing;
	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class WeaponsPowerUp extends TouchableComponent
	{
		
		public var useWeapon:Boolean = false;
		private static const NO_WEAPON:int = 0;
		private static const CROWNBAR:int = 1;
		private static const HAMMER:int = 2;
		private static const SLEDGEHAMMER:int = 3;
		
		//1 - crownbar / 2 - hammer / 3 - sledgehammer
		public var selectWeapon:int = NO_WEAPON;
		public var btCrownBar:TouchableComponent;
		public var btHammer:TouchableComponent;
		public var btSledgeHammer:TouchableComponent;
		private var descCrown:Component;
		private var descHammer:Component;
		private var descSledgeGamme:Component;
		private var selectCrown:Image;
		private var selectHammer:Image;
		private var selectSledgeGamme:Image;
		public var messageGuide:AssukarTextField;
		public var onblink:Function;
		public var offblink:Function;
		public var headerComp:Component;
		private var positionsY:Vector.<int>;
		
		public function WeaponsPowerUp() 
		{
			positionsY = new Vector.<int>();
			positionsY.push(80);
			positionsY.push(230);
			positionsY.push(390);
		}
		
		private var bumpCall:uint;
		private var toBump:Vector.<Component>;
		private var toBumpPos:Vector.<Number>;
		
		override public function dispose():void 
		{
			if ( bumpCall ) juggler.removeByID(bumpCall);
			
			super.dispose();
		}
		
		override protected function draww():void 
		{
			super.draww();
			
//			var quadSize:int = 120;
			var imagePos:Point = new Point(10,0);
			var scaleCard:Number = 0.8;
			var onBorder:Boolean = false;
			
			var keyCrown:String = Dictio.upper("mentoncrownbarlabel");
			descCrown = addComp(Component,{x:30,y:90});
			descCrown.addImage(MentonAssets.ME.texture("tooldescription"));
			descCrown.addText(270,70,keyCrown,Fonts.RUMPELSTILTSKIN,{border:onBorder,x:90,y:0,fontSize:50,color:0x000000,resizeOffset:true});
			
			btCrownBar = addComp(TouchableComponent,{x:395,y:80});
			btCrownBar.addImage(MentonAssets.ME.texture("cardweapon_normal"));
			selectCrown = btCrownBar.addImage(MentonAssets.ME.texture("cardweapon_selected"));
			btCrownBar.addImage(MentonAssets.ME.texture("tool1"),{x:imagePos.x,y:imagePos.y,scaleX:scaleCard,scaleY:scaleCard,smoothing: TextureSmoothing.BILINEAR});
			btCrownBar.RELEASE.listen(activeCrownBar);
			
			var keyHammer:String = Dictio.upper("mentonhammerlabel");
			descHammer = addComp(Component, { x:30, y:240 } );
			descHammer.addImage(MentonAssets.ME.texture("tooldescription"));
			descHammer.addText(270,70,keyHammer,Fonts.RUMPELSTILTSKIN,{border:onBorder,x:90,y:0, fontSize:50,color:0x000000,resizeOffset:true});
			
			btHammer = addComp(TouchableComponent,{x:395,y:230});
			btHammer.addImage(MentonAssets.ME.texture("cardweapon_normal"));
			selectHammer = btHammer.addImage(MentonAssets.ME.texture("cardweapon_selected"));
			btHammer.addImage(MentonAssets.ME.texture("tool2"), { x:imagePos.x, y:imagePos.y, scaleX:scaleCard, scaleY:scaleCard,smoothing: TextureSmoothing.BILINEAR } );
			btHammer.RELEASE.listen(activeHammer);
			
			var keySledgeHammer:String = Dictio.upper("mentonsledgehammerlabel");
			descSledgeGamme = addComp(Component, { x:30, y:400 } );
			descSledgeGamme.addImage(MentonAssets.ME.texture("tooldescription"));
			descSledgeGamme.addText(270, 70, keySledgeHammer, Fonts.RUMPELSTILTSKIN, {border:onBorder, x:90,y:0, fontSize:50, color:0x000000,resizeOffset:true } );
			
			btSledgeHammer = addComp(TouchableComponent,{x:395,y:390});
			btSledgeHammer.addImage(MentonAssets.ME.texture("cardweapon_normal"));
			selectSledgeGamme = btSledgeHammer.addImage(MentonAssets.ME.texture("cardweapon_selected"));
			btSledgeHammer.addImage(MentonAssets.ME.texture("tool3"), { x:imagePos.x, y:imagePos.y, scaleX:scaleCard, scaleY:scaleCard,smoothing: TextureSmoothing.BILINEAR } );
			btSledgeHammer.RELEASE.listen(activeSledgeHammer);

			messageGuide = addText(450,100,Dictio.upper("mentonchoicebox"),Fonts.RUMPELSTILTSKIN,{x:-70,y:460,fontSize:60,color:0xffffff,resizeOffset:true});

			headerComp = addComp(Component,{x:310,y:30});
			headerComp.addImage(MentonAssets.ME.texture("titulo_poderes"));
			headerComp.addText(180,40, Dictio.upper("mentonpowerup"), Fonts.RUMPELSTILTSKIN, {x:25, color:0xffffff, fontSize:40, resizeOffset:true } );
			
			toBump = new Vector.<Component>();
			toBumpPos = new Vector.<Number>();
		}
		
		private function bumpMe():void
		{
			for ( var i:int = 0 ; i < toBump.length ; i++)
			{
				juggler.removeTweens(toBump[i]);
				juggler.tween(toBump[i], .5, { y:toBumpPos[i] - 10, transition:Transitions.EASE_OUT_QUAD } );
			}
			delayCall("bumpout", juggler.delayCall(bumpMeOut, .5));
		}
		
		private function bumpMeOut():void
		{
			for ( var i:int = 0 ; i < toBump.length ; i++)
			{
				juggler.removeTweens(toBump[i]);
				juggler.tween(toBump[i], .5, { y:toBumpPos[i], transition:Transitions.EASE_IN_QUAD } );
			}
		}
		
		private function activateBump(target:Component):void
		{
			toBump.push(target);
			toBumpPos.push(target.y);
		}
		
		public function init():void
		{
			resetScale();
			
			btCrownBar.touchable = btHammer.touchable = btSledgeHammer.touchable = false;
			
			btCrownBar.disable();
			btHammer.disable();
			btSledgeHammer.disable();
			
			hide(selectSledgeGamme,selectCrown,selectHammer);
			hide(descCrown,descHammer,descSledgeGamme);
		}
		
		public function configure(session:FeteDuCitroinBonusSession):void
		{
			configurePositions(session);
			
			if (session.hasCrowbar)
			{
				show(btCrownBar);
				btCrownBar.enable();
				btCrownBar.touchable = true;
				activateBump(btCrownBar);
			}
			else
			{
				hide(btCrownBar);
			}
			
				
			if (session.hasHammer)
			{
				show(btHammer);
				btHammer.enable();
				btHammer.touchable = true;
				activateBump(btHammer);
			}
			else
			{
				hide(btHammer);
			}
			
			
			if (session.hasSledgehammer)
			{
				show(btSledgeHammer);
				btSledgeHammer.enable();
				btSledgeHammer.touchable = true;
				activateBump(btSledgeHammer);
				
			}
			else
			{
				hide(btSledgeHammer);
			}
			
			useWeapon = false;
			selectWeapon = NO_WEAPON;
			
			if (session.hasCrowbar || session.hasHammer || session.hasSledgehammer)
				show(headerComp);
			else
				hide(headerComp);
			
			if ( bumpCall ) juggler.removeByID(bumpCall);
			bumpCall = juggler.repeatCall(bumpMe, 1);
		}
		
		public function disableCrownBar():void
		{
			btCrownBar.disable();
			btCrownBar.touchable = false;
		}
		
		private function configurePositions(session:FeteDuCitroinBonusSession):void
		{
			if (session.hasCrowbar && session.hasHammer)
			{
				btCrownBar.y = positionsY[0];
				btHammer.y = positionsY[1];
				btSledgeHammer.y = positionsY[2];
			}
			else if (!session.hasCrowbar && session.hasHammer)
			{
				btHammer.y = positionsY[0];
				btSledgeHammer.y = positionsY[1];
			}
			else if (session.hasCrowbar && !session.hasHammer)
			{
				btCrownBar.y = positionsY[0];
				btSledgeHammer.y = positionsY[1];
			}
			else if (!session.hasCrowbar && !session.hasHammer)
			{
				btSledgeHammer.y = positionsY[0];
			}
			
			descCrown.y 		= btCrownBar.y + 10;
			descHammer.y 		= btHammer.y + 10;
			descSledgeGamme.y 	= btSledgeHammer.y + 10;
		}
		
		public function activeCrownBar(tc:TouchableComponent,t:Touch):void
		{
			if (selectWeapon == CROWNBAR)
			{
				useWeapon = false;
				selectWeapon = NO_WEAPON;
				animateHide(btCrownBar, descCrown, selectCrown);
				offblink();
			}
			else
			{
				resetScale();
				btCrownBar.scale = 1.2;
				useWeapon = true;
				selectWeapon = CROWNBAR;
				animateGuide(descCrown, selectCrown);
				onblink();
			}
		}
		
		public function activeHammer(tc:TouchableComponent,t:Touch):void
		{
			if (selectWeapon == HAMMER)
			{
				useWeapon = false;
				selectWeapon = NO_WEAPON;
				animateHide(btHammer, descHammer, selectHammer);
				offblink();
			}
			else
			{
				resetScale();
				btHammer.scale = 1.2;
				useWeapon = true;
				selectWeapon = HAMMER;
				animateGuide(descHammer, selectHammer);
				onblink();
			}
			
		}
		
		public function activeSledgeHammer(tc:TouchableComponent,t:Touch):void
		{
			if (selectWeapon == SLEDGEHAMMER)
			{
				useWeapon = false;
				selectWeapon = NO_WEAPON;
				animateHide(btSledgeHammer, descSledgeGamme, selectSledgeGamme);
				offblink();
			}
			else
			{
				resetScale();
				btSledgeHammer.scale = 1.2;
				
				useWeapon = true;
				selectWeapon = SLEDGEHAMMER;
				animateGuide(descSledgeGamme, selectSledgeGamme);
				onblink();
			}
		}
		
		private function animateGuide(currentComp:Component,currentSelect:Image):void
		{
			hide(descSledgeGamme, descHammer, descCrown);
			descSledgeGamme.x = descHammer.x =  descCrown.x = 30;
			descSledgeGamme.alpha = descHammer.alpha =  descCrown.alpha = 0;
			
			hide(selectSledgeGamme,selectCrown,selectHammer);
			
			currentComp.alpha = 0;
			currentComp.x += 200;
			show(currentComp,currentSelect);
			AssukarJuggler.ME.tween(currentComp,0.3,{alpha:1,x:30});
		}
		
		private function animateHide(currentBT:TouchableComponent,currentComp:Component,currentSelect:Image):void
		{
			hide(currentSelect);
			AssukarJuggler.ME.tween(currentBT, 0.1, { scaleX:1, scaleY:1 } );
			AssukarJuggler.ME.tween(currentComp, 0.1, { alpha:0 } );
		}
		
		public function resetScale():void
		{
			btCrownBar.scale = btHammer.scale = btSledgeHammer.scale = 1;
		}
		
		public function removeBump():void 
		{
			if ( bumpCall ) juggler.removeByID(bumpCall);
			for ( var i:int = 0 ; i < toBump.length ; i++ )
			{
				juggler.removeTweens(toBump[i]);
			}
			
			toBump = new Vector.<Component>();
			toBumpPos = new Vector.<Number>();
			
		}
		
	}

}