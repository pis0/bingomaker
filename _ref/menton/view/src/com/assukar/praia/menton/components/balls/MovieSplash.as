package com.assukar.praia.menton.components.balls
{
    import com.assukar.domain.services.dictio.Dictio;
    import com.assukar.praia.assets.Fonts;
    import com.assukar.praia.components.FontResolver;
    import com.assukar.praia.menton.assets.MentonAssets;
    import com.assukar.view.starling.AssukarMovieBytes;
    import com.assukar.view.starling.Component;

    import starling.animation.Transitions;
import starling.display.BlendMode;
import starling.display.Image;
    import starling.display.Quad;
    import com.assukar.view.starling.AssukarTextField;
    import starling.textures.TextureSmoothing;

    /**
	 * @author Diogo
	 */
	public class MovieSplash extends Component
	{
		private var label:AssukarTextField;
		private var movie:AssukarMovieBytes;
		private var maskk:Quad;
		private var ball:Image;
		private var ballContainer:Component;
		private var largeBallText:AssukarTextField;
		
		override protected function draww() : void
		{
			movie = addObject(new AssukarMovieBytes(MentonAssets.ME.getBytes("juicesplash"),MentonAssets.ME.texture,null,0,null,0,"",true),{visible:false, x:0});

			label = addText(430, 80, Dictio.upper("DoubleLine"), FontResolver.ME.resolveFontName(Fonts.IOWAN_BLACK), {x:-260, y:-45, fontSize:56, color:0x340100, autoScale:true, visible:false});
			
			maskk = addQuad(440,80, 0xff00ff,{x:-260, y:-45});
			maskk.scaleX = 0;
			
			label.mask = maskk;
			
			ballContainer = addComp(Component, {visible:false, centerPivots:true}, { name:"ball", y:9, x:-323, scaleX:.65, scaleY:.65});
			
			ball = ballContainer.addImage(MentonAssets.ME.texture("bigball"), {smoothing:TextureSmoothing.BILINEAR, centerPivots:true},{});
			
			largeBallText = ballContainer.addText(ball.width, ball.height, "", Fonts.IOWAN_BLACK, {centerPivots: true}, {centerRelativeTo:ball, color: 0x4d371e, fontSize:75, letterSpacing: -2});
			
		}
		
		public function reset() : void
		{
			juggler.removeTweens(ballContainer);
			juggler.removeTweens(maskk);
			juggler.removeTweens(label);
			
			movie.stop();
			hide(ballContainer, movie, label);
			ballContainer.y = 9;
			ballContainer.x = -323;
			ballContainer.rotation = 0;
			ballContainer.scaleX = ballContainer.scaleY = .65;
			maskk.scaleX = 0;
			largeBallText.text = "";
			label.alpha = 1;
			label.x = -260;
		}		

		override public function play(...animas) : void
		{
			show(ballContainer);
			
			juggler.tween(ballContainer, .2, {x:-260, scaleY:.6, onComplete:function():void
			{
				show(movie, label);
				movie.play();
				movie.repeatCount = 1;
				movie.fps = 45;
			
				juggler.tween(maskk, .2, {delay:.1, scaleX:1});
				juggler.tween(label, 2, {delay:.28, x:-250});
				
				
				juggler.tween(ballContainer, .2, {x:260, scaleY:1, scaleX:1 , transition:Transitions.EASE_IN_OUT_SINE});
				juggler.tween(ballContainer, 1.5, {delay:.29, x:280, rotation:.3});				

				juggler.tween(ballContainer, .2, {delay:2.7, x:550, rotation:.6,onComplete:reset });//
				juggler.tween(label, .2, {delay:2.5, alpha:0});
			}});						
		}

		public function setText(value : String) : void
		{
			reset();
			label.text = value;			
		}	
		
		public function setBallNumber(value : String) : void
		{
			largeBallText.text = value;
		}
		
	}
}
